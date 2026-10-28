# Kelime Bahçesi

**Kelime Bahçesi**: kelimeleri ezberletmek yerine gerçekten öğrettirmeyi hedefleyen **İngilizce ↔ Türkçe** kelime uygulaması. Her kelimenin unutma eğrisini tahmin eder, tam unutmaya yaklaşırken tekrar ettirir; **A1–C1** arası 4.954 kelime, her biri için birkaç yaygın Türkçe karşılık. Tamamen ücretsiz, hesapsız ve **çevrimdışı çalışan PWA** (bağımlılık yok, derleme yok).

Belgeler: [bilimsel dayanak (BILIM.md)](docs/BILIM.md) · [rakip analizi (RAKIP.md)](docs/RAKIP.md) · [hukuki kontrol listesi (HUKUK.md)](docs/HUKUK.md) · [ilk analiz (ANALIZ.md)](docs/ANALIZ.md).

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
NODE_PATH=$(npm root -g) node tests/e2e/story.cjs     # AI hikâye (API taklit edilir)
NODE_PATH=$(npm root -g) node tests/e2e/tabs.cjs      # pratik, slayt, hikâye okuyucu, görevler
NODE_PATH=$(npm root -g) node tests/e2e/offline.cjs   # çevrimdışı açılış
```

## Özellikler

* **4 sekme:** **Öğren** (günün görevleri, "daha fazla görev", günün kelimeleri), **Pratik yap** (10 mod), **Hikâyeler** (kütüphane + okuyucu), **İlerleme** (aralıklı tekrar aşamaları, istatistik, kelime listesi). Ayarlar profil simgesinden.
* **Görseller:** 263 somut kelime için **özgün vektör çizim** (`art/`, kodla üretilir: `node tools/art/real.mjs`); çizimi olmayan somut kelimelerde emoji, diğerlerinde seviye renginde harf karosu. Kart, günün kelimeleri ve **Görsel testi**nde kullanılır; bir sorudaki seçeneklerin hepsi aynı görsel dilde (çizim ya da emoji) gelir.
* **Hikâyeler:** 10 özgün, çevrimdışı hikâye (A1–B1), paragraf Türkçe çevirisi, **kelimeye dokununca anlam** (çekimli biçimler çözülür), bildiğin kelimeler yeşil, tek dokunuşla öğrenme listesine ekleme, günün hikâyesi görevi, favoriler ve hikâyelerde kelime arama.
* **Pratik modları:** karma, slayt gösterisi (sesli, otomatik), dinleme, telaffuz, yazma, dikte, görsel testi, çeviri, ters çeviri, cümle tamamlama; kaynak: öğrendiklerim / zor / favoriler. Pratik zamanlamayı değiştirmez.
* **Günlük akış:** önce vadesi gelen tekrarlar, sonra 3'lü gruplar hâlinde yeni kelimeler (tanıt → tanı → pekiştir).
* **Kaydırmalı kartlar:** sağa = öğrenelim, sola = zaten biliyorum (bilinenin yerine yeni kelime gelir).
* **8 alıştırma türü:** Türkçesi nedir? · İngilizcesi nedir? · dinle-seç · Türkçeden yaz · dikte · cümle boşluğu (seçmeli/yazılı) · görsel · konuşma (destekleyen tarayıcıda). Olgunlaştıkça zorlaşır. Bir harf hatası "neredeyse" sayılır.
* **Cümle okuyucu ve hikâye detayı:** cümle cümle okuma, sesle vurgulama, cümle çevirisi, hedef kelime listesi, yazı boyutu.
* **Yazma karoları:** harfleri dokunarak diz (ayardan klavyeye geçilir), ipucu ve yavaş telaffuz.
* **Meditasyon, ses kaydı, slayt gösterisi, listeli pratik** (öğrendiklerim/bildiklerim listesinden "Pratik yap", X ile çıkarma), **resimli dinleme**.
* **Örnek cümle çevirisi:** kartta "Cümleyi çevir", geri bildirimde ve kelime penceresinde Türkçe karşılığı (yapay zekâ yazımı, insan denetimi yok).
* **Hafıza modeli:** her kelime için kararlılık ve güçlük izlenir; unutma eğrisi güç yasasıdır (R = 1/(1+t/9S)). İlk tekrar ertesi gün, sonra ≈ 3 → 8 → 18 → 37 → 72 gün (en fazla 365). Tekrar, hedef hatırlama olasılığına (%85/90/95) göre hesaplanır; cevaptan otomatik not çıkar. Birikince yeni kelime azalır. Bkz. docs/BILIM.md.
* **Bahçem:** hafıza gücü (tahmini hatırlama %), her kelimenin aşaması (tohum → filiz → fidan → ağaç), unutmaya yaklaşan kelimeler, kişisel hatırlatıcı not.
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
js/app.js         sekmeler: Öğren, Pratik yap, İlerleme, kelimeler, ayarlar
js/storiesui.js   Hikâyeler sekmesi, okuyucu, AI üretici arayüzü
js/slideshow.js   slayt gösterisi
js/stories.js     isteğe bağlı AI hikâye API'si ve doğrulama
js/lemma.js, visuals.js   çekim çözümleyici, emoji/karo
data/words.js     üretilmiş kelime verisi (tools/build_words.py)
data/emoji.js, data/stories.js   görseller ve çevrimdışı hikâyeler
data-src/         kaynak veri: wordlist.psv, translations.psv, extra_translations.psv
tests/            birim (node --test) ve uçtan uca (Playwright) testler
```

## Kelime verisi

`data-src/wordlist.psv` (kelime|seviye|tür) A1–C1 seviyeli başlangıç listesi açık kaynaklı `cefr-analyzer` (MIT) paketinden alındı; **verinin özgün kaynağı doğrulanmadı** (bkz. docs/HUKUK.md). Türkçe karşılıklar ve örnek cümleler (`translations.psv`, `extra_translations.psv`) bu proje için **yapay zekâ ile yazıldı ve tam olarak insan incelemesinden geçmedi**; hatalı gördüğünüz çeviriyi uygulamadan bildirebilir ya da dosyaları düzenleyip yeniden üretebilirsiniz:

```bash
python3 tools/build_words.py   # data/words.js üretir ve tutarlılığı doğrular
```

Kelime listesinin kaynağını ve lisansını ticari yayın öncesinde mutlaka doğrulayın.
