# Update Warna Skenario Tarif Akomodasi

## 🎨 Perubahan Warna Badge Kelas

Berdasarkan permintaan user, warna badge kelas pada halaman **Skenario Tarif Akomodasi** telah disesuaikan dengan warna yang sama seperti di halaman **Kalkulasi Biaya Kelas Akomodasi**.

### 🎯 Warna yang Diterapkan:

| Kelas | Warna Badge | Background | Text | Border |
|-------|-------------|------------|------|--------|
| **VVIP** | 🔴 Merah Tua | `bg-red-500` | `text-white` | `border-red-500` |
| **VIP** | 🟣 Ungu Tua | `bg-purple-500` | `text-white` | `border-purple-500` |
| **I** | 🔵 Biru Tua | `bg-blue-500` | `text-white` | `border-blue-500` |
| **II** | 🟢 Hijau Tua | `bg-green-500` | `text-white` | `border-green-500` |
| **III** | 🟠 Orange Tua | `bg-orange-500` | `text-white` | `border-orange-500` |

### 📍 Lokasi Perubahan:

#### 1. **Badge Kelas** (Kolom pertama tabel)
```tsx
<Badge 
  variant="outline" 
  className={`text-base px-3 py-1 ${
    item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
    item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
    item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
    item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
    item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
    'bg-gray-500 text-white border-gray-500'
  }`}
>
  Kelas {item.kelas}
</Badge>
```

#### 2. **Badge Profit Persen** (Kolom terakhir tabel)
```tsx
<Badge 
  variant={item.profitPersen >= 0 ? "default" : "destructive"} 
  className={`text-sm font-bold px-3 py-1 ${
    item.profitPersen >= 0 
      ? item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
        item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
        item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
        item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
        item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
        'bg-gray-500 text-white border-gray-500'
      : 'bg-red-500 text-white border-red-500'
  }`}
>
  {item.profitPersen.toFixed(2)}%
</Badge>
```

### 🎨 Visual Result:

**Sebelum:**
- Semua badge kelas menggunakan warna default (abu-abu)
- Badge profit menggunakan warna default

**Sesudah:**
- **Kelas VVIP**: Badge merah tua dengan background merah solid dan text putih
- **Kelas VIP**: Badge ungu tua dengan background ungu solid dan text putih  
- **Kelas I**: Badge biru tua dengan background biru solid dan text putih
- **Kelas II**: Badge hijau tua dengan background hijau solid dan text putih
- **Kelas III**: Badge orange tua dengan background orange solid dan text putih

### 🔧 Technical Details:

#### CSS Classes yang Digunakan:
- **Background**: `bg-{color}-500` (warna solid/tua)
- **Text**: `text-white` (text putih untuk kontras maksimal)
- **Border**: `border-{color}-500` (border dengan warna yang sama)

#### Conditional Logic:
```tsx
item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
'bg-gray-500 text-white border-gray-500'
```

### ✅ Benefits:

1. **Konsistensi Visual**: Warna badge sama dengan halaman Kalkulasi Biaya Kelas Akomodasi
2. **User Experience**: User dapat dengan mudah mengidentifikasi kelas berdasarkan warna
3. **Brand Consistency**: Mengikuti skema warna yang sudah established di aplikasi
4. **Accessibility**: Warna yang kontras untuk readability

### 🎯 File yang Dimodifikasi:

- `src/pages/SkenarioTarifAkomodasi.tsx` - Update warna badge kelas dan profit

### 🧪 Testing:

- [x] Warna badge kelas sesuai dengan halaman referensi
- [x] Warna badge profit mengikuti skema yang sama
- [x] Responsive design tetap berfungsi
- [x] No linter errors
- [x] Conditional logic bekerja dengan benar

### 📱 Preview:

```
┌─────────────────────────────────────────────────────────┐
│ Skenario Tarif Akomodasi                               │
├─────────────────────────────────────────────────────────┤
│ ┌─ Data Skenario Tarif Akomodasi per Kelas ─────────┐   │
│ │ Kelas      │ Rata UC │ Tarif │ Profit Rp │ % │ Aksi │   │
│ ├────────────┼─────────┼───────┼───────────┼───┼──────┤   │
│ │ 🔴 VVIP    │ 300K    │ 400K  │ +100K     │33%│ ✏️   │   │
│ │ 🟣 VIP     │ 250K    │ 350K  │ +100K     │40%│ ✏️   │   │
│ │ 🔵 I       │ 200K    │ 280K  │ +80K      │40%│ ✏️   │   │
│ │ 🟢 II      │ 150K    │ 200K  │ +50K      │33%│ ✏️   │   │
│ │ 🟠 III     │ 100K    │ 120K  │ +20K      │20%│ ✏️   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Update selesai!** 🎉 Warna badge sekarang konsisten dengan halaman Kalkulasi Biaya Kelas Akomodasi.
