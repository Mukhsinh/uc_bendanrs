# Restrukturisasi Menu Skenario Tarif

## 📋 Overview
Melakukan restrukturisasi menu untuk mengorganisir fitur skenario tarif dengan lebih baik.

## 🎯 Perubahan yang Dilakukan:

### 1. **Menu Lama** ❌
```
├── Skenario Tarif (direct link)
└── Skenario Tarif Akomodasi (direct link)
```

### 2. **Menu Baru** ✅
```
├── Skenario Tarif (parent menu)
│   ├── Skenario Tarif Tindakan (submenu)
│   └── Skenario Tarif Akomodasi (submenu)
```

## 🔧 Technical Changes:

### **File: `src/components/SidebarNav.tsx`**

#### **Before:**
```tsx
{
  title: "Skenario Tarif",
  icon: FileText,
  href: "/skenario-tarif",
},
{
  title: "Skenario Tarif Akomodasi",
  icon: Bed,
  href: "/skenario-tarif-akomodasi",
},
```

#### **After:**
```tsx
{
  title: "Skenario Tarif",
  icon: FileText,
  subItems: [
    { title: "Skenario Tarif Tindakan", href: "/skenario-tarif", icon: FileText },
    { title: "Skenario Tarif Akomodasi", href: "/skenario-tarif-akomodasi", icon: Bed },
  ],
},
```

### **Auto-Expand Logic:**
```tsx
if (item.title === "Skenario Tarif" && (currentPath.includes("skenario-tarif"))) return item.title;
```

## 📍 Menu Structure:

### **Parent Menu: Skenario Tarif**
- **Icon**: FileText
- **Behavior**: Expandable accordion
- **Auto-expand**: Ketika user berada di salah satu submenu

### **Submenu 1: Skenario Tarif Tindakan**
- **Path**: `/skenario-tarif-tindakan`
- **Icon**: FileText
- **Description**: Halaman skenario tarif untuk tindakan medis
- **Redirect**: URL lama `/skenario-tarif` akan redirect ke `/skenario-tarif-tindakan`

### **Submenu 2: Skenario Tarif Akomodasi**
- **Path**: `/skenario-tarif-akomodasi`
- **Icon**: Bed
- **Description**: Halaman skenario tarif untuk akomodasi per kelas

## 🎨 Visual Result:

### **Sidebar Navigation:**
```
┌─ Skenario Tarif ▼────────────┐
│  ├─ Skenario Tarif Tindakan  │
│  └─ Skenario Tarif Akomodasi │
└──────────────────────────────┘
```

### **When Expanded:**
```
┌─ Skenario Tarif ▼────────────┐
│  ├─ Skenario Tarif Tindakan  │ ← Active
│  └─ Skenario Tarif Akomodasi │
└──────────────────────────────┘
```

## ✅ Benefits:

1. **Better Organization**: Mengelompokkan fitur skenario tarif dalam satu parent menu
2. **Cleaner Sidebar**: Mengurangi clutter di sidebar navigation
3. **Logical Grouping**: Skenario tarif tindakan dan akomodasi terkait erat
4. **Scalable**: Mudah menambah submenu skenario tarif lainnya di masa depan
5. **User Experience**: Navigation yang lebih intuitif dan terorganisir

## 🔄 User Flow:

### **Accessing Skenario Tarif Tindakan:**
1. User klik menu **"Skenario Tarif"** (parent menu expand)
2. User klik **"Skenario Tarif Tindakan"** (navigate to `/skenario-tarif-tindakan`)

### **Accessing Skenario Tarif Akomodasi:**
1. User klik menu **"Skenario Tarif"** (parent menu expand)
2. User klik **"Skenario Tarif Akomodasi"** (navigate to `/skenario-tarif-akomodasi`)

## 🧪 Testing Checklist:

- [x] Menu "Skenario Tarif" muncul sebagai parent menu
- [x] Submenu "Skenario Tarif Tindakan" muncul dengan path `/skenario-tarif-tindakan`
- [x] Submenu "Skenario Tarif Akomodasi" muncul dengan path `/skenario-tarif-akomodasi`
- [x] Auto-expand logic bekerja (menu expand saat user di submenu)
- [x] Navigation berfungsi dengan benar
- [x] Icons ditampilkan dengan benar
- [x] No linter errors
- [x] Responsive design tetap berfungsi
- [x] URL redirect dari `/skenario-tarif` ke `/skenario-tarif-tindakan` berfungsi

## 📱 Mobile Compatibility:

Menu structure tetap responsive di mobile dengan:
- **Sheet/Modal** untuk mobile navigation
- **Accordion behavior** tetap berfungsi
- **Touch-friendly** interface

## 🎯 Future Enhancements:

Menu "Skenario Tarif" dapat dikembangkan dengan submenu tambahan:
- Skenario Tarif Laboratorium
- Skenario Tarif Radiologi
- Skenario Tarif Operatif
- Skenario Tarif Cathlab
- dll.

## 📄 Files Modified:

- `src/components/SidebarNav.tsx` - Update menu structure dan auto-expand logic

## ✅ Status: COMPLETED

Restrukturisasi menu berhasil dilakukan dengan:
- ✅ Parent menu "Skenario Tarif" created
- ✅ Submenu "Skenario Tarif Tindakan" moved
- ✅ Submenu "Skenario Tarif Akomodasi" moved
- ✅ Auto-expand logic implemented
- ✅ Navigation working correctly
- ✅ No breaking changes
