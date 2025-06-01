# Slider System Test Guide

## ✅ Complete Slider Management System

The Green Roasteries website now has a fully functional slider management system!

## 🧪 How to Test

### 1. **Access Admin Panel**
```
URL: http://localhost:3000/backend/content/sliders
```

### 2. **Create a New Slider**
- Click "Add New Slider" 
- Fill in title, subtitle, button text
- Upload a background image
- Customize colors and animations
- Save the slider

### 3. **View on Homepage**
```
URL: http://localhost:3000/
```
- Sliders should appear in the hero section
- Auto-rotate every 5 seconds
- Responsive design on mobile/desktop

### 4. **Test API Endpoints**

#### Get All Sliders
```bash
curl http://localhost:3000/api/sliders
```

#### Get Admin View (includes inactive)
```bash
curl http://localhost:3000/api/sliders?admin=true
```

#### Create New Slider
```bash
curl -X POST http://localhost:3000/api/sliders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Slider",
    "subtitle": "Test Description", 
    "buttonText": "Shop Now",
    "buttonLink": "/shop",
    "imageUrl": "https://example.com/image.jpg",
    "backgroundColor": "#ffffff",
    "isActive": true,
    "order": 0
  }'
```

## 🎨 Features Included

✅ **Admin Interface**
- Modern responsive design
- Live preview with device switching
- Image upload (base64 encoding)
- Color picker with presets
- Animation settings
- Multi-language support (EN/AR)

✅ **API Endpoints**
- Full CRUD operations
- Validation and error handling
- Consistent Prisma integration

✅ **Frontend Display**
- Responsive slider component
- Smooth animations with Framer Motion
- Auto-rotation with pause on hover
- Navigation controls and dots
- Fallback content for errors

✅ **Advanced Features**
- Overlay effects with opacity control
- Pattern overlays
- Multiple layout options
- Custom color schemes
- Order management
- Active/inactive status

## 🔧 System Architecture

```
┌─ Backend Admin (/backend/content/sliders)
│  ├─ List View (with previews)
│  ├─ Create/Edit Modal (with live preview) 
│  └─ Bulk Operations
│
├─ API Layer (/api/sliders)
│  ├─ GET / - List all active sliders
│  ├─ GET /?admin=true - List all sliders
│  ├─ POST / - Create new slider
│  ├─ GET /[id] - Get specific slider
│  ├─ PUT /[id] - Update slider
│  └─ DELETE /[id] - Remove slider
│
├─ Database (Prisma + PostgreSQL)
│  └─ Slider model with all attributes
│
└─ Frontend Display (/)
   └─ Hero Slider Component
      ├─ Auto-rotation
      ├─ Navigation
      └─ Responsive design
```

## 🚀 Ready for Production

The slider system is complete and production-ready with:
- Proper error handling
- Performance optimizations  
- SEO-friendly structure
- Accessibility features
- Mobile responsiveness
- Multi-language support

You can now create, manage, and display beautiful hero sliders on the Green Roasteries website! 