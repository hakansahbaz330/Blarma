# İlk analiz ve tasarım kararları (iç belge)

> Bu ilk sürümün analiz notudur. Güncel mantık: [BILIM.md](BILIM.md), [RAKIP.md](RAKIP.md); hukuki konular: [HUKUK.md](HUKUK.md). Başka bir uygulamanın adını, görsellerini ya da metinlerini içermez; yalnızca özellik fikirleri incelenmiştir.

> **Araştırmanın sınırı (önemli):** Bu oturumun ağ erişimi App Store, Google Play ve Blarma'nın kendi sitesini doğrudan açmaya izin vermedi (bağlantılar engellendi). Aşağıdaki mağaza yorumları, arama sonuçlarının döndürdüğü özetlerden ve üçüncü taraf sayfalardan derlendi; yorumların tamamını ya da son hâlini okumadım. Fiyatlar ve puanlar kaynaktan kaynağa değişiyor, bu yüzden "yaklaşık" okuyun. Uygulamayı kendi telefonunda açıp 1 yıldızlı ve 3 yıldızlı yorumları filtrelemek bu analizi doğrulamanın en iyi yoludur.

## 1. Blarma nedir, nasıl çalışır?

Blarma, **yalnızca kelime** öğretmeye odaklanan bir dil uygulaması (geliştirici: Blarma Teknoloji A.Ş., Türkiye; iOS Ağustos 2022'den beri; Android'de 100 bin+ indirme). Dilbilgisi dersi yok; "kelime dağarcığını hızla büyüt" yaklaşımı.

Mağaza açıklamalarından çıkan çalışma prensibi:

1. **Kurulum:** ana dil, hedef dil ve seviye seçilir; günlük kelime hedefi belirlenir (Türkçe, İngilizce dahil 10+ dil).
2. **Öğrenme kartı:** her kelime bir **fotoğraf** ve ana dildeki açıklamayla gelir. Karta **kaydırınca** kelimenin sesi ve hedef dildeki tanımı açılır.
3. **Test türleri:** görsel, dinleme, telaffuz ve yazma testleri.
4. **Aralıklı tekrar:** kelimeler **1, 3, 7, 30 ve 120 gün** sonra hatırlatılır.
5. **Koleksiyonlar:** favoriler ve "zor kelimeler".
6. **İlerleme:** öğrenilen kelime sayısı, günlük seri, seri rekoru, aktif günler; konu/zorluk bazlı takip.
7. **Yapay zekâ hikâyeleri:** öğrenilen kelimelerle kısa hikâyeler.
8. Ücretsiz indirilir; uygulama içi abonelikle tam sürüm (yaklaşık 3 günlük deneme sonrası ödeme duvarı).

Puan: Google Play ≈ 4,7 (≈5,9 bin yorum), App Store ≈ 4,7–4,8. Genel olarak sevilen bir uygulama; "kısa günlük oturumlar", "görsel + ses", "hikâyelerde eski kelimelerin tekrar geçmesi" övülüyor.

## 2. Kullanıcı yorumlarından çıkan şikâyetler ve istekler

| Tekrar eden konu | Kaynak (özet) | Bizim cevabımız |
|---|---|---|
| **Fiyat / ödeme duvarı:** deneme biter bitmez her şey kilitleniyor; "bu kadar paraya dayalı bir uygulama olamaz"; bir kullanıcı yıllık planın bir anda $60'a çıktığını bildirdi (geliştirici "sistem hatası" dedi) ve Anki'ye geçti; Brezilyalı bir kullanıcı günlük 15 kelimelik **ücretsiz sürüm** önerdi | Google Play / App Store yorumları (arama özetleri) | Uygulama **tamamen ücretsiz**, hesap ve sunucu yok, çevrimdışı çalışır |
| **Bildiğim kelimeler tekrar tekrar geliyor;** yalnızca "favori"yi kaldırabiliyorsun, pratikte işaretlemeye zorlanıyorsun | App Store yorumu | Kartta **kaydırarak "zaten biliyorum"**, her alıştırmada "bu kelimeyi biliyorum", **seviye belirleme testi**; bilinen kelimenin yerine otomatik yeni kelime gelir, günlük hedef bozulmaz |
| **Özel kelime listesi** yok | Aggregator özeti | **Kendi kelimeni ekle** (birden fazla Türkçe karşılıkla) |
| **Yapay zekâ hikâyelerinin doğruluğu** | Aggregator özeti | Hikâye üretimi **doğrulanır:** hedef kelimelerin hepsi metinde işaretli değilse bir kez daha denenir; eksik kalanlar kullanıcıya gösterilir |
| Her kelimeye **tek karşılık** gösterme / bağlamsız öğrenme | Genel kelime-uygulaması eleştirisi | Kelime başına **2–4 yaygın Türkçe karşılık**, tür etiketi (isim/fiil…) ve örnek cümle; tüm karşılıklar doğru kabul edilir |
| Deneme sonrası ödeme uyarısı ("para tuzağı") | App Store yorumu | Abonelik/deneme yok |

## 3. Benzer uygulamalar ve ders çıkarılanlar

* **Anki:** ücretsiz, açık kaynak, esnek; ama hazır desteler çoğu zaman sıkıcı, bağlamsız ve sessiz; öğrenme eğrisi dik. → *Anki'nin tekrar gücünü, hazır içerik + ses + bağlamla birleştir.*
* **Memrise:** topluluk kurslarının kaldırılması ve arayüz değişikliği sonrası memnuniyet düşüşü, ücretli sürümde hata şikâyetleri. → *Kullanıcıya ait içeriği (kendi kelimeleri) elinden alma; verisini yedeklenebilir yap.*
* **Drops:** yalnızca görsel kelime kartları; 7 günlük deneme sonrası beklenmedik yıllık ücret şikâyeti. → *Şeffaf, ücretsiz.*
* **Duolingo:** oyunlaştırma öğrenmenin önüne geçiyor ("konuşmak yerine kelime eşleştiriyorum"). Tek kontrollü çalışmada (203 öğrenci, 6 hafta) Duolingo grubu kelime gelişiminde öne çıkmış. → *Oyunlaştırmayı (seri, XP) hafif tut; alıştırmaları geri çağırmaya (yazma, dinleme) dayandır.*
* **Lingvist:** uyarlanabilir hız beğeniliyor ama az sayıda ana dil. **Lingualeo:** yalnızca kelime kelime çeviri eleştirisi. → *Cümle içinde öğret.*
* **Aralıklı tekrar araştırması:** SM-2'nin "ease hell" sorunu (sürekli unutulan kartın aralığının büyümemesi); FSRS gibi daha yeni modeller aynı hatırlama hedefinde %20–50 daha az tekrar iddia ediyor (rakamlar satıcı bloglarından, doğrulanmadı). → *SM-2 türevi sade bir model kullandık, ama "ease" tabanını koruyup unutulan kelimeleri 4 unutmadan sonra "zor kelime" olarak ayırdık; ileride FSRS'ye geçilebilir.*

## 4. Kelime Bahçesi: Blarma ile aynı çekirdek, farklar

**Aynı çekirdek:** günlük kelime hedefi, kartla tanıtma + ses, çok türlü test (görsel yerine metin/dinleme/yazma/cümle), aralıklı tekrar, favori/zor koleksiyonları, seri ve istatistik, hikâyeler.

**Neleri değiştirdik / ekledik:**

* 100% ücretsiz, çevrimdışı PWA (telefona "ana ekrana ekle" ile kurulur), hesap/izleme yok; ilerleme cihazda, JSON yedekle/geri yükle.
* **Oxford A1–C1 yapısında 4.954 kelime**; her kelime için 2–4 yaygın Türkçe karşılık (kelimelerin %93'ünde ≥2), tür, örnek cümle.
* **Seviye belirleme testi** ve "zaten biliyorum" kaydırması; test sonrası doğru bilinenler 3 gün sonra doğrulama tekrarına girer (şans eseri bilinenler sınanır).
* **Alıştırma olgunluğa göre zorlaşır:** yeni kelime → çoktan seçmeli/dinleme; olgunlaştıkça cümle boşluğu, yazma, dikte, (destekleyen tarayıcıda) konuşma. Bir harf yazım hatası "neredeyse" kabul edilir.
* **Seri dondurma:** bir gün kaçırırsan seri korunur (7 günlük seride +1 hak).
* **Zor kelime (leech) tespiti:** 4+ kez unutulan kelime ayrı bir pratik listesinde.
* **Kendi kelimeni ekle**, **çeviri hatası bildir** (yerel liste, JSON'a dışa aktarılır).
* **İsteğe bağlı hikâye:** kullanıcının kendi Anthropic API anahtarıyla, sunucusuz.

**Ekran görüntülerinden doğrulanan Blarma yapısı (kullanıcının paylaştığı 4 ekran):** *Öğren* (günün görevleri: yeni kelimeler, günün hikâyesi, "daha fazla görev", günün kelimeleri fotoğraf ızgarası), *Pratik yap* (meditasyon, slayt gösterisi, dinleme, telaffuz, ses kayıt, yazma, görsel testi, çeviri testi, ters çeviri), *Hikâyeler* (resimli, seviye etiketli, favori ve kelime arama), *İlerleme* (% tamamlandı, "kilidini açtığın" kelime sayısı, öğrendiğim/zor/bildiğim/favori, Yeni → 1/3/7/30/120. gün aşamaları). Kelime Bahçesi aynı bilgi mimarisini izler; fark: sınırsız ve ücretsiz, kendi kelime ekleme, seri dondurma, hikâyede dokununca çeviri. Henüz **yok:** gerçek fotoğraflar/resimli hikâyeler (yerine emoji ve renkli karolar), meditasyon ve ses kayıt modları.

## 5. Dürüst sınırlar ve yol haritası

**Şu an olmayanlar** (Blarma'daki en büyük fark): kelime **fotoğrafları** ve resimli hikâyeler yok (emoji kullanılıyor, 600+ kelimede); konu/tema kategorileri yok; IPA fonetik yazımı yok; hesap/bulutta eşitleme yok; yerel mobil uygulama (App Store/Play) değil PWA.

**Kalite uyarıları:**

* Türkçe karşılıklar ve örnek cümleler yapay zekâ ile yazıldı; 4.954 kelimenin hepsini insan gözüyle gözden geçirmedim. Özellikle B2/C1 soyut kelimelerde bazı ek karşılıklar zayıf olabilir. Bunun için uygulamada **"Çeviri hatalı"** düğmesi var; bildirimleri `ayarlar → hatalı çeviri bildirimlerini indir` ile toplayıp düzeltin. Yayın öncesi bir Türkçe/İngilizce editörün listeyi taramasını öneririm.
* Kelime listesi, Oxford 3000/5000'in A1–C1 yapısına uyan açık kaynaklı (MIT) bir paketten (`cefr-analyzer`) alındı; Oxford'un tanımlarını/örneklerini kopyalamadım. Oxford listelerinin kendisi OUP telifine tabi olabilir: **ticari yayın öncesi lisansı doğrulayın.**
* Sesli okuma ve konuşma tanıma cihazın/tarayıcının sesine bağlıdır (konuşma tanıma Chrome/Edge/Android'de var, Firefox'ta yok); yoksa o alıştırmalar kapanır.
* Hikâye özelliği gerçek API'ye karşı canlı denenmedi (anahtar/ağ yoktu); istek biçimi, doğrulama ve arayüz taklit edilmiş yanıtlarla test edildi. Model adı Ayarlar'dan değiştirilebilir.

**Sıradaki iyileştirmeler (öncelik sırasıyla):**

1. Kelime listesinin insan editör taraması; ek kelime paketleri (seyahat, iş, akademik).
2. Görseller: açık lisanslı simge/illüstrasyon (ör. ARASAAC/OpenMoji) ile somut isimlere resim.
3. FSRS tabanlı zamanlama (kullanıcının yanıt geçmişinden kişiselleşen aralıklar).
4. Konu/tema koleksiyonları ve "kendi listemi içe aktar (CSV)".
5. Bulut yedekleme/eşitleme (isteğe bağlı), yerel mobil paketleme (Capacitor).
6. Çok dilli genişleme (veri biçimi zaten `kelime → karşılıklar[]`).

## Kaynaklar

* Blarma App Store (aggregator): https://apps.apple.com/us/app/-/id1594884449 · https://mwm.ai/apps/vocabulary-learning-app-blarma/1594884449
* Blarma Google Play: https://play.google.com/store/apps/details?id=com.blarma · APKCombo: https://apkcombo.com/vocabulary-builder-app-blarma/com.blarma/
* Educational App Store incelemesi: https://www.educationalappstore.com/app/blarma · AlternativeTo: https://alternativeto.net/software/blarma
* Memrise/Lingvist/Duolingo geri bildirimleri: https://www.g2.com/products/Memrise/reviews · https://kimola.com/reports/uncover-the-impact-memrise-apps-user-feedback-report-app-store-us-147885 · https://unstar.app/blog/language-learning-app-reviews-duolingo-babbel-rosetta-stone-2026
* SM-2 / FSRS karşılaştırması: https://migaku.com/blog/language-fun/spaced-repetition-in-2026-what-actually-works-for-language-learners · https://www.diane.app/en/guides/fsrs-vs-sm2
