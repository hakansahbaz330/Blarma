# Bir kelime gerçekten nasıl öğrenilir? Bilimsel dayanak ve uygulamadaki karşılığı

Bu belge, uygulamanın tekrar mantığının neye dayandığını ve neyin henüz kanıtlanmadığını açıkça yazar. Kaynaklar arama sonuçlarından ve genel literatürden; her iddiayı özgün makaleden doğrulamadım.

## 1. "Ezberlemek" ile "öğrenmek" arasındaki fark

Bir kelimeyi öğrenmiş saymak, onu **ihtiyaç duyduğunda, ipucu olmadan, hızlıca** hatırlayabilmek demektir. Yeni bir kelimeyi bir kez görüp tanımak ("bunu biliyorum") ile onu aylar sonra hatırlamak farklı şeylerdir. Aşağıdaki bulgular ikincisine odaklanır.

## 2. Dayanak olan bulgular

| Bulgu | Ne diyor | Uygulamadaki karşılığı |
|---|---|---|
| **Unutma eğrisi** (Ebbinghaus ve sonrası) | Unutma başta hızlı, sonra yavaş. Güç yasası eğrisi modele iyi uyar. | Her kelime için `R(t) = 1 / (1 + t / (9·kararlılık))`. `t` = son tekrardan beri gün. Kararlılık = hatırlama %90'a düşene dek geçen gün. |
| **Aralıklı tekrar / aralık etkisi** (Cepeda ve ark. 2006 meta-analizi: 317 deney; 2008: 1.350+ kişi) | Tekrarlar arasındaki en iyi boşluk, ne kadar süre hatırlanacağına bağlı olarak büyür. Hatırlama süresi uzadıkça en iyi boşluğun oranı küçülür (≈ %20–40'tan %5–10'a). Yabancı dil sözcükleri için 2009 devam çalışması, en iyi boşlukla kalıcı hatırlamanın %150'ye kadar arttığını bildirdi. | İlk tekrar ertesi gün; sonra aralıklar 3 → 8 → 18 → 37 → 72 → 133 günlük kabaca 2–2,5 kat artar. Tekrar zamanı hedef hatırlama olasılığına (%90 varsayılan) göre hesaplanır. |
| **Test etkisi / geri çağırma pratiği** (Roediger ve Karpicke 2006 ve L2 sözcük çalışmaları) | Hatırlamaya çalışmak, aynı süre tekrar okumaktan daha iyi kalıcılık sağlar. Bir yabancı dil çalışmasında, öğrenildikten sonra tekrar çalışmanın gecikmeli hatırlamaya katkısı yoktu; tekrar test etmenin büyük katkısı vardı. | Her tekrar bir **soru**dur; cevap önce gösterilmez. Kelimeyi "okuyup geçmek" yoktur. |
| **Başarısız geri çağırma bile öğretir** (Arnold ve McDermott 2013, "test-potentiated learning") | Doğru hatırlayamasan da denemek, sonraki çalışmayı etkili kılar. | Yanlış cevaptan sonra doğrusu hemen gösterilir ve kelime kısa aralıkla yeniden gelir. |
| **İstenen zorluk** (Bjork) | Hatırlaması biraz zor olan çalışma daha kalıcı öğretir. | Hafıza zayıfken (unutmaya yakın) yapılan başarılı tekrar, kararlılığı daha çok artırır. Çok erken tekrar az kazandırır. |
| **Üretim etkisi** | Cevabı kendin üretmek, seçmekten daha güçlüdür. | Olgunlaşan kelimeler seçmeli sorudan **yazarak** hatırlamaya geçer. Çoktan seçmeli, şans payı nedeniyle "kolay" sayılmaz. |
| **Kaç karşılaşma gerekir?** (Nation ve çalışma alanı) | Kesin sayı yok; literatürde altı ile yirmi arasında, sık anılan değer yaklaşık 12–16. | Bir kelime onlarca kez değil, **birkaç doğru zamanlı geri çağırmayla** kalıcı hâle gelir; hikâyeler ve örnek cümleler ek karşılaşma sağlar. |
| **Birden çok bağlam / çoklu kodlama** | Aynı kelimeyi ses, görsel ve cümleyle edinmek bağları artırır. | Kart: yazılış, ses, emoji/karo, örnek cümle ve çevirisi. Farklı alıştırma türleri aynı kelimeyi farklı yoldan sorar. |
| **Kişisel bağ** | Kişisel anımsatıcılar zor kelimelerde yardımcı olur. | "Kendi hatırlatıcın" notu; zor kelimede (4+ unutma) bunu öneren uyarı. |
| **Uyku ve pekişme** | Öğrenme sonrası uyku, yeni anıları pekiştirir. Bu uygulamada bunu tek başına ölçmedik; genel bilgi olarak kullandık. | İlk tekrar **ertesi gün**. Oturum sonunda bunu kullanıcıya açıklarız. |

## 3. Modelin işleyişi

Her kart: `st` (kararlılık, gün), `d` (güçlük 1–10), son tekrar günü.

* **Yeni kelime:** Üç kelimelik gruplar hâlinde tanıt → tanı (seç) → pekiştir. Temiz geçerse `st = 1,2`; hata sayısı arttıkça düşer. İlk tekrar ertesi gün.
* **Doğru tekrar:** `st` artar. Artış, `(11 − d)/6 · st^-0,2 · e^{2,2·(1 − R)}` ile orantılı. Yani kolay kelimede, düşük kararlılıkta ve hafıza zayıfken daha büyük.
* **Zor (ipucu / yakın yazım / çok yavaş):** artış %35'e iner.
* **Kolay (yazarak, hızlı, olgun kelime):** artış %135'e çıkar.
* **Yanlış:** `st` yarıya iner (alt sınır 0,6 gün), kelime ertesi gün gelir, oturum içinde de birkaç soru sonra yeniden sorulur.
* **Hedef hatırlama olasılığı:** Ayarlardan Rahat %85, Dengeli %90, Sıkı %95. Sonraki aralık `9 · st · (1/hedef − 1)`.
* **Aşamalar:** Tohum (`st < 3`), Filiz (`< 10`), Fidan (`< 30`), Ağaç (`≥ 30` gün: "kalıcı").
* **Yük dengesi:** Bekleyen tekrar ≥ 18 ise yeni kelime üçte bire, ≥ 30 ise sıfıra iner; son günlerde tekrar başarısı %70'in altındaysa yarıya iner.

## 4. Sınırlar ve dürüst notlar

* **Sabitler (1,45; 2,2; −0,2 gibi) literatürdeki genel şekle göre elle ayarlandı;** gerçek kullanıcı verisiyle kalibre edilmedi. Aralıkları makul (1 → 3 → 8 → 18 → 37 → 72 gün) ama "optimum" olduğu kanıtlanmadı. Yayından sonra veriyle ayarlanmalı (ör. açık kaynak FSRS-benzeri bir optimizasyonla).
* **Model, FSRS'ten esinlenir ama kopya değildir;** aynı üç değişken (kararlılık, güçlük, hatırlama olasılığı) ve güç yasası fikri açık literatürde. FSRS'in MIT lisanslı olduğu bilinir; ürün koduna bu uygulama için ayrıca yazıldı.
* **"Hafıza gücü %", ölçüm değil modelin tahminidir.**
* **Uyku bulgusu** tekrar zamanlamasına yön verdi ama uygulama içinde test edilmedi.
* **Mnemonik ve dilbilgisi** konularında yüzeysel kaldık.
* **Kulaktan duyma ve gerçek konuşma** kelime ezberinden ayrı beceri; uygulama bunu sadece destekler.
* Cepeda 2008 makalesinin **sözcük** üzerinde değil gerçek bilgiler üzerinde yapıldığını not ederim; sözcük için bulgu 2009'daki devam çalışmasındadır. Blog özetlerindeki belirli gün rakamlarını özgün makaleden doğrulamadım, bu yüzden uygulamada onları sabit olarak kullanmadım.

## Kaynakça (arama sonuçlarında doğrudan görülenler)

* Cepeda, Pashler, Vul, Wixted, Rohrer (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin*.
* Cepeda, Vul, Rohrer, Wixted, Pashler (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science* — [PubMed](https://pubmed.ncbi.nlm.nih.gov/19076480/)
* Cepeda ve ark. (2009). Optimizing distributed practice. *Experimental Psychology*.
* Roediger & Karpicke (2006). Test-enhanced learning. *Psychological Science*.
* Arnold & McDermott (2013). Test-potentiated learning. *Journal of Experimental Psychology: LMC*.
* Nation, P. (çeşitli) — sözcük öğrenmede karşılaşma sayısı üzerine; ayrıca Saragi, Nation & Meister (1978).
* Ye, J. ve ark. — FSRS, açık kaynak aralıklı tekrar zamanlayıcısı (fikir olarak başvuruldu).

## 5. Güncelleme: araştırmadan çıkan yeni kurallar

Bu bölüm, ikinci tur araştırmanın uygulamaya yansıyan sonuçlarıdır. Her madde kaynağıyla birlikte, doğrulama sınırı açıkça yazılarak verilmiştir.

| Bulgu | Uygulamadaki karşılığı |
|---|---|
| **En iyi aralık, hatırlanacak süreyle orantılıdır** (Cepeda ve ark. 2008): birkaç haftalık hedefte en iyi tekrar aralığı yaklaşık %20'dir (ikinci bir özet %10–40 bandını verir); bir yıllık hedefte %5'e iner. Kısa aralık, uzun aralıktan daha çok zarar verir. Makale sözcük değil bilgi sorularıyla yapıldı; yabancı sözcük için 2009 devam çalışması bakılmalı. | Aralık hâlâ hedef hatırlama olasılığından türetilir; aralıkların 1 → 3 → 7 → 30 → 120 gün merdiveni olarak **kelime kartında gösterilir**. Hedefi "Rahat/Dengeli/Sıkı" ile değiştirmek, bu oranı kaydırır. |
| **Ardışık yeniden öğrenme** (Rawson & Dunlosky): oturum içinde önce ölçüte kadar çalış, sonra **aralıklı oturumlarda yeniden** öğren. Tek oturumda üç kez hatırlamak, üç ayrı oturumda birer kez hatırlamaktan belirgin biçimde zayıf bulundu (ikinci elden aktarılan örnek: 1 hafta sonra yaklaşık %26 ve %68). Kesin sayıları özgün makaleden doğrulamadım. | Yeni kelime oturum içinde iki doğru çağırmayla geçer ve **ertesi gün, sonra 3. gün, 7. gün…** yeniden sorulur. Yanlışlar oturum sonunda "şimdi tekrar et" ile hemen çalıştırılabilir, ama zamanlama değişmez. |
| **Kümelenmeyi önleme** (FSRS ve benzeri zamanlayıcılar ±%5 rastgele titreşim kullanır) | ≥ 5 günlük aralıklara kelimeye ve güne bağlı **sabit ±%5 titreşim**: aynı gün öğrenilen kelimeler aynı gün birikmez. |
| **Kişiye uyarlama** (FSRS parametreleri kullanıcının verisiyle eğitilir) | Tam FSRS eğitimi yerine **tek çarpanlı basit uyarlama**: her tekrarda tahmin edilen hatırlama olasılığı ile gerçek sonuç tutulur; her 25 tekrarda gerçek oran beklenenden düşükse aralıklar kısalır, yüksekse uzar (adım ≤ %12, çarpan 0,6–1,6). Bu, kalibre edilmiş bir model değil, güvenli bir otomatik ayardır. |
| **Üretim tanımadan zordur; beceriler ayrıdır** (üretim etkisi, alıcı/üretici sözcük bilgisi ayrımı) | Her kelimede **dört beceri** ayrı izlenir: anlam, dinleme, yazma, konuşma (her biri 1–3 yıldız). Zayıf beceriye ait alıştırma türü daha sık seçilir (olasılıkla; çeşitlilik kalır). |
| **Başarısız denemeden sonra geri bildirim** | Oturum sonunda kelime kelime: doğru/yanlış, anlam, **senin cevabın** ve örnek cümle. |

**Hâlâ yapılmadı / bilinmiyor:** Sabitler (1,45; 2,2…) kişisel veriyle eğitilmedi; uyarlama çarpanı tek bir sayıdır. Bir gün içinde ek "akşam tekrarı" (uyku öncesi) önerisi test edilmedi. Beceri yıldız eşikleri (1/3/5 başarı) ürün kararıdır, bilimsel bir eşik değildir.

### Kaynaklar (bu turda aramada doğrudan görülenler)

* Cepeda ve ark. (2008) — [York Üniversitesi sayfası](https://www.yorku.ca/ncepeda/publications/CVRWP2008.html); 2009 devamı: [Cepeda ve ark. 2009](https://www.yorku.ca/ncepeda/publications/CCRWMP2009.html)
* Successive relearning üzerine derleme: [Rawson & Dunlosky 2022, Current Directions in Psychological Science](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)
* FSRS-5 güç yasası eğrisi ve ±%5 titreşim örneği: [Borretti, "Implementing FSRS in 100 Lines"](https://borretti.me/article/implementing-fsrs-in-100-lines), [Obsidian FSRS eklentisi](https://community.obsidian.md/plugins/fsrs)
