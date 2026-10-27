# Kelime Bahçesi

Blarma'dan esinlenen, **İngilizce ↔ Türkçe** kelime öğrenme uygulaması. Aralıklı tekrar, sesli telaffuz, her kelime için birkaç yaygın Türkçe karşılık ve Oxford **A1–C1** yapısında 4.954 kelime. Tamamen ücretsiz, hesapsız ve **çevrimdışı çalışan PWA** (bağımlılık yok, derleme yok).

Blarma incelemesi, kullanıcı yorumları ve tasarım kararları: [docs/ANALIZ.md](docs/ANALIZ.md).

## Çalıştırma

```bash
npm start          # http://localhost:8080  (python3 http.server)
npm test           # birim testleri (Node 20+)
```

Telefonda açıp tarayıcı menüsünden **"Ana ekrana ekle"** ile uygulama gibi kurabilirsiniz. ES modülleri kullandığı için `file://` ile değil bir HTTP sunucusuyla açın.

Uçtan uca testler (Playwright gerekir, sunucu açıkken):

```bash
NODE_PATH=$(npm root -g) node tests/e2e/smoke.cjs     # onboarding, oturum, kelimeler, ayarlar
NODE_PATH=$(npm root -g) node tests/e2e/review.cjs    # tekrar akışı, tüm alıştırma türleri, seviye testi
NODE_PATH=$(npm root -g) node tests/e2e/story.cjs     # hikâye (API taklit edilir)
```

## Özellikler

* **Günlük akış:** önce vadesi gelen tekrarlar, sonra 3'lü gruplar hâlinde yeni kelimeler (tanıt → tanı → pekiştir).
* **Kaydırmalı kartlar:** sağa = öğrenelim, sola = zaten biliyorum (bilinenin yerine yeni kelime gelir).
* **7 alıştırma türü:** Türkçesi nedir? · İngilizcesi nedir? · dinle-seç · Türkçeden yaz · dikte · cümle boşluğu (seçmeli/yazılı) · konuşma (destekleyen tarayıcıda). Olgunlaştıkça zorlaşır. Bir harf hatası "neredeyse" sayılır.
* **Aralıklı tekrar:** 1 → 3 → ~8 → ~20 → ~50 → ~125 gün (en fazla 180); unutulunca sıfırlanır, 4+ unutma "zor kelime".
* **Seviye belirleme testi**, hedef seviyeler (A1–C1), günlük hedef (5–30).
* **Kelimeler:** Türkçe/İngilizce arama, seviye/durum filtreleri, favori, "biliyorum", sıfırla, **kendi kelimeni ekle**, **çeviri hatası bildir**.
* **Seri + seri dondurma, XP, istatistik** (14 gün, 7 günlük tekrar tahmini, seviye ilerlemesi).
* **Sesli okuma** (aksan/hız/ses seçimi), açık/koyu tema, klavye desteği (1–4, Enter, Esc).
* **İsteğe bağlı yapay zekâ hikâyeleri:** Ayarlar'a kendi Anthropic API anahtarını girerseniz öğrendiğiniz kelimelerle hikâye üretir; hedef kelimeler doğrulanır. Anahtar yalnızca tarayıcıda saklanır.
* **Yedek:** ilerleme JSON olarak dışa/içe aktarılır. Hiçbir veri sunucuya gitmez (hikâye özelliği hariç, o da doğrudan Anthropic'e).

## Yapı

```
index.html, css/style.css, manifest.webmanifest, sw.js
js/srs.js         zamanlama (saf fonksiyonlar)
js/exercises.js   alıştırma üretimi, çeldiriciler, cevap denetimi
js/session.js     oturum kuyruğu ve puanlama
js/store.js       localStorage durumu, seri, yedek
js/sessionui.js   oturum + seviye testi arayüzü
js/app.js         ana sayfa, kelimeler, istatistik, ayarlar
js/stories.js     isteğe bağlı AI hikâyeleri
data/words.js     üretilmiş kelime verisi (tools/build_words.py)
data-src/         kaynak veri: wordlist.psv, translations.psv, extra_translations.psv
tests/            birim (node --test) ve uçtan uca (Playwright) testler
```

## Kelime verisi

`data-src/wordlist.psv` (kelime|seviye|tür) A1–C1 Oxford 3000/5000 yapısına uyan açık kaynaklı `cefr-analyzer` (MIT) paketinden alındı. Türkçe karşılıklar ve örnek cümleler (`translations.psv`, `extra_translations.psv`) bu proje için **yapay zekâ ile yazıldı ve tam olarak insan incelemesinden geçmedi**; hatalı gördüğünüz çeviriyi uygulamadan bildirebilir ya da dosyaları düzenleyip yeniden üretebilirsiniz:

```bash
python3 tools/build_words.py   # data/words.js üretir ve tutarlılığı doğrular
```

Oxford listelerinin lisansını ticari yayın öncesinde kontrol edin.
