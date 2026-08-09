# Sayılarla Boyama

Next.js + React + TypeScript ile hazırlanmış, mobil uyumlu bir "fotoğrafı sayılarla boyama" uygulaması.

## Özellikler

- Hazır çizimler
- JPG / PNG / WEBP fotoğraf yükleme
- Fotoğrafı tarayıcı içinde renk azaltma (quantization) ile analiz etme
- Bölgeleri otomatik ayırma
- Numaralı boyama şablonu oluşturma
- 6–20 renk arasında detay seviyesi
- Renkli önizleme
- PNG olarak indirme
- Mobil/tablet/masaüstü responsive tasarım
- Görseli sunucuya göndermeden client-side işleme

## Kurulum

```bash
npm install
npm run dev
```

Sonra `http://localhost:3000` adresini aç.

## Üretim

```bash
npm run build
npm start
```

## Not

Bu sürüm eğitim/oyun prototipi olarak tarayıcıda çalışacak şekilde tasarlanmıştır. Çok büyük fotoğraflarda işlem yükünü azaltmak için görseller otomatik olarak yaklaşık 620 px uzun kenara küçültülür.
