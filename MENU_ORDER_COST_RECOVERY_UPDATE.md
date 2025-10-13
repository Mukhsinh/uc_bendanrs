# Update Urutan Menu Cost Recovery

## 📋 Overview
Memindahkan menu "Cost Recovery" ke posisi di bawah menu "Distribusi Biaya" sesuai permintaan user.

## 🎯 Perubahan yang Dilakukan:

### **Urutan Menu Sebelumnya** ❌
```
├── Rekapitulasi Unit Cost
├── Cost Recovery                    ← Posisi lama
├── Skenario Tarif
├── Distribusi Biaya
└── ...
```

### **Urutan Menu Setelahnya** ✅
```
├── Rekapitulasi Unit Cost
├── Skenario Tarif
├── Distribusi Biaya
├── Cost Recovery                    ← Posisi baru
└── ...
```

## 🔧 Technical Changes:

### **File: `src/components/SidebarNav.tsx`**

#### **Before:**
```tsx
{
  title: "Rekapitulasi Unit Cost",
  icon: BarChart3,
  href: "/rekapitulasi-unit-cost",
},
{
  title: "Cost Recovery",           // ← Posisi lama
  icon: PieChart,
  href: "/cost-recovery",
},
{
  title: "Skenario Tarif",
  icon: FileText,
  subItems: [...],
},
{
  title: "Distribusi Biaya",
  icon: TrendingUp,
  subItems: [...],
},
```

#### **After:**
```tsx
{
  title: "Rekapitulasi Unit Cost",
  icon: BarChart3,
  href: "/rekapitulasi-unit-cost",
},
{
  title: "Skenario Tarif",
  icon: FileText,
  subItems: [...],
},
{
  title: "Distribusi Biaya",
  icon: TrendingUp,
  subItems: [...],
},
{
  title: "Cost Recovery",           // ← Posisi baru
  icon: PieChart,
  href: "/cost-recovery",
},
```

## 📍 Urutan Menu Final:

| No | Menu | Icon | Type | Position |
|----|------|------|------|----------|
| 1 | Dashboard | Home | Direct | Top |
| 2 | Data Master | Database | Parent | - |
| 3 | Data Operasional | FileText | Parent | - |
| 4 | Unit Penunjang | Building | Parent | - |
| 5 | Unit Keperawatan | Users | Parent | - |
| 6 | Unit Pelayanan | Stethoscope | Parent | - |
| 7 | Unit Diklat | GraduationCap | Parent | - |
| 8 | Rekapitulasi Unit Cost | BarChart3 | Direct | - |
| 9 | Skenario Tarif | FileText | Parent | - |
| 10 | Distribusi Biaya | TrendingUp | Parent | - |
| 11 | **Cost Recovery** | PieChart | Direct | **← Moved here** |
| 12 | Logout | LogOut | Action | Bottom |

## ✅ Benefits:

1. **Logical Flow**: Cost Recovery ditempatkan setelah Distribusi Biaya untuk alur yang lebih logis
2. **User Experience**: Menu yang terkait (Distribusi Biaya → Cost Recovery) berada berdekatan
3. **Workflow**: Mengikuti alur kerja: Distribusi Biaya → Cost Recovery
4. **Consistency**: Menjaga konsistensi dengan struktur menu yang ada

## 🔄 User Workflow:

### **Alur Kerja yang Lebih Logis:**
1. **Distribusi Biaya** - Melakukan distribusi biaya
2. **Cost Recovery** - Melakukan cost recovery dari distribusi yang sudah dilakukan

### **Navigation Flow:**
```
User → Distribusi Biaya → Cost Recovery
     ↓
   Related menus are now adjacent
```

## 🧪 Testing Checklist:

- [x] Menu "Cost Recovery" berhasil dipindahkan
- [x] Posisi baru: Setelah menu "Distribusi Biaya"
- [x] Icon dan href tetap sama
- [x] No linter errors
- [x] Navigation berfungsi dengan benar
- [x] Responsive design tetap berfungsi

## 📱 Visual Result:

### **Sidebar Navigation:**
```
┌─ Rekapitulasi Unit Cost ─────┐
├─ Skenario Tarif ▼───────────┤
│  ├─ Skenario Tarif Tindakan  │
│  └─ Skenario Tarif Akomodasi │
├─ Distribusi Biaya ▼─────────┤
│  ├─ Distribusi Biaya Pertama │
│  ├─ Distribusi Biaya Kedua   │
│  └─ Distribusi Biaya Rekap   │
├─ Cost Recovery ──────────────┤ ← Moved here
└─ Logout ─────────────────────┘
```

## 📄 Files Modified:

- `src/components/SidebarNav.tsx` - Update urutan menu items

## ✅ Status: COMPLETED

Perubahan urutan menu berhasil dilakukan dengan:
- ✅ Menu "Cost Recovery" dipindahkan ke posisi baru
- ✅ Posisi baru: Setelah menu "Distribusi Biaya"
- ✅ No breaking changes
- ✅ Navigation tetap berfungsi
- ✅ No linter errors
