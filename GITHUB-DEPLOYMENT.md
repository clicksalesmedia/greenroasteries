# GitHub-Based Deployment Guide for Green Roasteries

This guide explains how to set up and use GitHub Actions for automated deployment of the Green Roasteries website.

## Setup Instructions

### 1. Generate SSH Key Pair for GitHub Actions

First, you need to generate an SSH key for GitHub Actions to use when connecting to your server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -C "github-actions@greenroasteries"
```

Don't set a passphrase for this key.

### 2. Add the SSH Public Key to Your Server

Copy the public key to your server:

```bash
cat ~/.ssh/github_actions_deploy.pub
```

Then add this key to the authorized_keys file on your server:

```bash
ssh root@167.235.137.52
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
```

### 3. Add the SSH Private Key to GitHub Secrets

Copy the private key:

```bash
cat ~/.ssh/github_actions_deploy
```

Go to your GitHub repository:
1. Click on "Settings"
2. Select "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the entire private key including the BEGIN and END lines

### 4. Commit Your Changes and Push

```bash
# Remove the large files from git tracking
git rm --cached website-update-*.tar.gz
git rm --cached deploy-*.tar.gz

# Commit your changes
git add .
git commit -m "Set up GitHub Actions deployment workflow"
git push origin main
```

## How It Works

The deployment workflow works as follows:

1. When you push to the main branch, GitHub Actions automatically triggers the deployment
2. It creates a deployment package (excluding node_modules, .next, etc.)
3. It uploads this package to your server using SSH
4. It extracts the package and restarts the Docker containers

## Manual Deployment

You can also trigger the deployment manually:

1. Go to your GitHub repository
2. Click on "Actions"
3. Select the "Deploy to Server" workflow
4. Click "Run workflow"
5. Confirm by clicking the green "Run workflow" button

## Troubleshooting

If deployment fails:

1. Check the GitHub Actions logs for detailed error messages
2. Verify that the SSH key has been added correctly to both GitHub Secrets and the server
3. Check that the server IP and file paths in the workflow file are correct
4. SSH to the server manually and check Docker logs:
   ```bash
   ssh root@167.235.137.52
   cd /var/www/greenroasteries
   docker-compose logs
   ``` 