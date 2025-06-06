import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const lines = searchParams.get('lines') || '100';
    const filter = searchParams.get('filter') || '';

    let command = '';
    let description = '';

    switch (type) {
      case 'webhook':
        command = `pm2 logs greenroasteries --lines ${lines} --nostream | grep -i "stripe webhook" | tail -50`;
        description = 'Stripe Webhook Logs';
        break;
      case 'error':
        command = `pm2 logs greenroasteries --lines ${lines} --nostream --err-only | tail -50`;
        description = 'Error Logs';
        break;
      case 'payment':
        command = `pm2 logs greenroasteries --lines ${lines} --nostream | grep -i "payment\\|stripe\\|order" | tail -50`;
        description = 'Payment & Order Logs';
        break;
      case 'all':
      default:
        command = `pm2 logs greenroasteries --lines ${lines} --nostream | tail -50`;
        description = 'All Application Logs';
        break;
    }

    // Add filter if provided
    if (filter) {
      command += ` | grep -i "${filter}"`;
    }

    const { stdout, stderr } = await execAsync(command);
    
    // Parse logs into structured format
    const logLines = stdout.split('\n').filter(line => line.trim() !== '');
    const logs = logLines.map((line, index) => {
      // Extract timestamp, level, and message
      const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      const timestamp = timestampMatch ? timestampMatch[1] : '';
      
      // Determine log level based on content
      let level = 'info';
      if (line.includes('[ERROR]') || line.includes('Error') || line.includes('error')) {
        level = 'error';
      } else if (line.includes('[WARN]') || line.includes('Warning') || line.includes('warn')) {
        level = 'warning';
      } else if (line.includes('[SUCCESS]') || line.includes('✅') || line.includes('Created order')) {
        level = 'success';
      } else if (line.includes('[Stripe Webhook]')) {
        level = 'webhook';
      }

      return {
        id: index,
        timestamp: timestamp || new Date().toISOString(),
        level,
        message: line,
        raw: line
      };
    });

    // Get system status
    const statusCommand = 'pm2 status greenroasteries --no-colors';
    const { stdout: statusOutput } = await execAsync(statusCommand).catch(() => ({ stdout: 'Status unavailable' }));

    return NextResponse.json({
      logs,
      description,
      totalLines: logs.length,
      systemStatus: statusOutput,
      lastUpdated: new Date().toISOString(),
      type,
      filter: filter || null
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch logs',
        logs: [],
        description: 'Error fetching logs',
        totalLines: 0,
        systemStatus: 'Error',
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint for log management actions
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    let command = '';
    let message = '';

    switch (action) {
      case 'restart':
        command = 'pm2 restart greenroasteries';
        message = 'Application restarted successfully';
        break;
      case 'flush':
        command = 'pm2 flush greenroasteries';
        message = 'Logs flushed successfully';
        break;
      case 'reload':
        command = 'pm2 reload greenroasteries';
        message = 'Application reloaded successfully';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { stdout, stderr } = await execAsync(command);

    return NextResponse.json({
      success: true,
      message,
      output: stdout,
      error: stderr || null
    });

  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
} 