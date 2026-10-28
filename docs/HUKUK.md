# Hukuki risk kontrol listesi (mağazaya çıkmadan önce)

Bu bir **hukuki tavsiye değildir.** Yayından önce fikrî mülkiyet konusunda uzman bir avukata danışın. Aşağıdaki liste, riskli yerleri bulmak ve hangilerini kapattığımızı göstermek içindir.

## Temel ilke

Başkasının **fikri, işleyişi, özellik listesi** serbesttir (ör. aralıklı tekrar, seri, günlük hedef, kart çevirme). Korunan şey **ifadedir**: kaynak kod, metinler, görseller, sesler, karakterler, ayırt edici görünüm (trade dress), ad ve logo. Ayrıca bazı şirketlerin **patentleri** olabilir; bu ayrı bir konudur ve avukatla "özgür kullanım" taraması gerektirir.

## Bu projede yaptıklarımız

| Konu | Durum |
|---|---|
| Kaynak kod | Baştan kendi yazdığımız kod; başka uygulamanın kodu, dosyası ya da çıkarılmış varlığı kullanılmadı. |
| Başka bir uygulamanın adı, görselleri, metinleri | Kullanılmıyor. Ekran görüntülerinden yalnızca **özellik fikirleri** alındı; yerleşim, renk ve metinler kopyalanmadı. Görsel kimlik değiştirildi (renk paleti, yazı tipi, düz bileşenler, kendi logomuz, bitki benzetmesi). Uygulama arayüz metinleri kendi cümlelerimiz. |
| Logo / simge | Kendi çizdiğimiz sade SVG (yaprak çıkan filiz). Üçüncü taraf simge seti kullanılmadı (arayüz çizgileri elle yazıldı). |
| Yazı tipleri | Bricolage Grotesque ve Figtree, **SIL Open Font License 1.1**. Lisans metinleri `fonts/` içinde. |
| Çizimler (`art/`, 782 SVG; 698 kelime çizimi + 84 kavram piktogramı) | Bu projede kodla yazdığımız özgün vektör çizimler; hiçbir stok görsel, simge seti ya da başka uygulamanın çizimi kullanılmadı. Kuralları `tools/art/kit2.mjs`, kaynakları `tools/art/set*.mjs`. Yapay zekâ ile üretildikleri için telif sahipliği ülkeye göre belirsiz olabilir; marka kimliği olarak kritikse bir illüstratörle sözleşmeli seti düşünün. Kelime listesinde olmayan çizimler eklenmez (test bunu denetler). |
| Emoji | Cihazın kendi emoji yazı tipi kullanılıyor; uygulama emoji görüntüsü barındırmıyor. Platformlar arasında görünüm farklıdır. |
| Ses | Cihazın konuşma sentezi ve WebAudio ile üretilen gürültü. Hazır ses dosyası yok. |
| Hikâyeler, örnek cümleler, Türkçe karşılıklar | Yapay zekâyla yazıldı. **İnsan gözden geçirmesi yok.** Hataları ve telif/özgünlük belirsizliği olabilir. Yayın öncesi bir editör/çevirmen gözden geçirmeli; yapay zekâ üretimi içeriğin telifi ülkeye göre belirsizdir. |

## En büyük açık risk: kelime listesi

* Seviyeli kelime listesi (`cefr-analyzer` MIT paketinden) **A1–C1** seviyelerine ayrılmış ve **Oxford 3000/5000** yapısına çok benziyor. Paketin MIT lisansı, içindeki **verinin** kaynağını ya da hakkını temizlemez.
* Oxford 3000/5000, Oxford University Press'in telifli ve markalı listesidir. Tek tek kelimeler telif konusu olmaz, ama **seçim ve seviye ataması** (derleme) korunabilir.
* **Yaptığımız:** Arayüzde ve belgelerde "Oxford" adı kullanılmıyor; "A1–C1 seviyeleri" deniyor. Tanım ve örnekler Oxford'dan alınmadı.
* **Yapılması gereken (yayından önce):** (1) Listenin gerçek kaynağını netleştirin; (2) mümkünse açık lisanslı bir sıklık verisinden (kendi türettiğimiz seviyelerle) yeni bir liste kurun, (3) arayüzde seviyeyi "yaklaşık" diye işaretleyin, resmî CEFR değil. Bunu isterseniz ben yapabilirim; çevirilerin yeniden eşlenmesi gerekir.

## İsim

"Kelime Bahçesi" Türkçe sıradan bir ifade; bu da marka olarak **zayıf ve çakışabilir** demek. Yayından önce TÜRKPATENT, EUIPO, USPTO ve her iki mağazada isim taraması yapın. Gerekirse daha ayırt edici bir ad seçin.

## Taklit sayılabilecek yerlerden kaçındıklarımız

Duolingo'ya özgü yeşil baykuş tarzı karakter, "can/lig/enerji" sistemi, yeşil + kalın alt gölgeli düğme, çatışan ödül sesleri; Blarma'nın yerleşimi ve renkli ikon kareleri. Bunlar kullanılmadı ya da kaldırıldı.

## Mağaza ve veri uyumu

* **Gizlilik politikası** gerekli (iki mağaza da ister). Bu uygulama veriyi sunucuya göndermez; ilerleme tarayıcıda saklanır. İsteğe bağlı hikâye özelliği kullanıcının kendi Anthropic anahtarıyla doğrudan Anthropic'e gider; bunu politikaya yazın.
* **KVKK/GDPR:** Analitik ve hesap yok. Bildirim ve bulut eklenirse yeniden değerlendirin.
* **Çocuklar:** Hedef kitle 13 yaş altını içeriyorsa ek kurallar (COPPA, Apple Kids) ve ebeveyn onayı gerekir.
* **Apple 4.2 (asgari işlev):** Yalnızca web sayfasını saran uygulamalar reddedilebilir. Yerel paketleme (Capacitor vb.), çevrimdışı çalışma ve cihaz özellikleri kullanın.
* **Yapay zekâ içeriği:** Hikâye/çeviri yapay zekâyla üretiliyorsa mağaza açıklamasında belirtin.
* **Üçüncü taraf bildirimleri:** `THIRD_PARTY_NOTICES.md` dosyasını uygulama içinde "Lisanslar" sayfasında gösterin.

## Patent

Aralıklı tekrar algoritmaları ve oyunlaştırma yöntemleri üzerinde bazı şirketlerin patenti olabilir. Burada yazdığımız zamanlama formülü literatürdeki genel fikirlere dayanıyor ve kimsenin kodundan alınmadı, ama patent taramasını ben yapamam.
