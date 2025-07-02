import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import db from '@/app/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fix = searchParams.get('fix') === 'true'

    const results = {
      missingProductImages: [] as any[],
      missingCategoryImages: [] as any[],
      missingSliderImages: [] as any[],
      missingVariationImages: [] as any[],
      fixed: 0
    }

    // Check product images
    const products = await db.product.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    })

    for (const product of products) {
      if (product.imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', product.imageUrl)
        try {
          await fs.access(imagePath)
        } catch {
          results.missingProductImages.push({
            id: product.id,
            name: product.name,
            image: product.imageUrl
          })

          if (fix) {
            await db.product.update({
              where: { id: product.id },
              data: { imageUrl: null }
            })
            results.fixed++
          }
        }
      }
    }

    // Check category images
    const categories = await db.category.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    })

    for (const category of categories) {
      if (category.imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', category.imageUrl)
        try {
          await fs.access(imagePath)
        } catch {
          results.missingCategoryImages.push({
            id: category.id,
            name: category.name,
            image: category.imageUrl
          })

          if (fix) {
            await db.category.update({
              where: { id: category.id },
              data: { imageUrl: null }
            })
            results.fixed++
          }
        }
      }
    }

    // Check slider images
    const sliders = await db.slider.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true
      }
    })

    for (const slider of sliders) {
      if (slider.imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', slider.imageUrl)
        try {
          await fs.access(imagePath)
        } catch {
          results.missingSliderImages.push({
            id: slider.id,
            title: slider.title,
            image: slider.imageUrl
          })

          if (fix) {
            // Since imageUrl is required for sliders, deactivate instead of setting null
            await db.slider.update({
              where: { id: slider.id },
              data: { isActive: false }
            })
            results.fixed++
          }
        }
      }
    }

    // Check variation images
    const variations = await db.productVariation.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        imageUrl: true,
        product: {
          select: {
            name: true
          }
        }
      }
    })

    for (const variation of variations) {
      if (variation.imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', variation.imageUrl)
        try {
          await fs.access(imagePath)
        } catch {
          results.missingVariationImages.push({
            id: variation.id,
            productName: variation.product.name,
            image: variation.imageUrl
          })

          if (fix) {
            await db.productVariation.update({
              where: { id: variation.id },
              data: { imageUrl: null }
            })
            results.fixed++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: fix ? `Fixed ${results.fixed} records with missing images` : 'Missing images identified',
      ...results
    })

  } catch (error) {
    console.error('Error checking missing images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check missing images' },
      { status: 500 }
    )
  }
} 