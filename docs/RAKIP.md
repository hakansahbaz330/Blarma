# Rakip analizi ve neyi neden aldık

Amaç: büyük dil uygulamalarının işe yarayan yanlarını alıp, kullanıcıyı yoran yanlarını bırakmak. Bu belge iç çalışma notudur.

## Kaynakların güvenilirliği (önce bunu oku)

* **İndirme sıralaması doğrulanamadı.** Sensor Tower, Appfigures ve Statista'nın güncel (2025–26) sıralamalarına bu ortamdan erişemedim; arama sonuçlarında rakamlar gizliydi. Aşağıdaki "en çok indirilen 10" listesi, farklı kaynaklarda tutarlı biçimde en üstte anılan uygulamalara dayanır; sıra ve rakam iddiası değildir. Yayın kararından önce Sensor Tower/AppMagic'ten güncel sıralamayı almak gerekir.
* Duolingo'nun Google Play'de 100M+ yüklemeye ulaştığı ve dil uygulamaları arasında lider olduğu birden fazla kaynakta tutarlı. Memrise "80 milyon öğrenen" iddiasını kendisi yapıyor (mağaza listesi, bağımsız değil).
* Özellik bilgileri uygulamaların kendi bloglarına, genel basına ve kullanıcı yorumu derlemelerine dayanır. Yorum derlemeleri istatistiksel ölçüm değil, örüntü gösterir.
* App Store / Google Play sayfalarına bu ortamdan erişilemediği için yorumları tek tek okuyamadım.

## İncelenen on uygulama

| Uygulama | Güçlü yanı | Kullanıcıların şikâyeti | Bizim kararımız |
|---|---|---|---|
| **Duolingo** | Küçük günlük dozlar, seri, yumuşak zorluk ayarı, yapay zekâyla alıştırma seçimi | Oyunlaştırma öğrenmenin önüne geçiyor, seri kaybetme stresi, enerji/can sistemi ve reklamlar, konuşma zayıf | **Seri ve günlük hedefi** küçük tuttuk, **ceza yok** (can, lig, enerji alınmadı). Alıştırma zorluğunu otomatik ayarlama fikrini aldık. |
| **Babbel** | Diyalog tabanlı dersler, gözden geçirme yöneticisi | Ücretsiz deneme sonrası beklenmedik ücret, az açıklama | **Tekrar yöneticisini** "Bugün" planına çevirdik; hiçbir ücret/abonelik duvarı yok. |
| **Busuu** | Topluluk düzeltmesi, aralıklı gözden geçirme | Ücretli duvar | Topluluk özelliği hesap/sunucu gerektirir; **şimdilik yok**. |
| **Memrise** | Anımsatıcılar ("mems"), ses/video örnekleri, aralıklı tekrar | Topluluk kurslarının kaldırılması, zamanlamayı göremezsin/değiştiremezsin | **Kişisel hatırlatıcı notu** aldık; zamanlamayı şeffaf yaptık (sonraki tekrar günü ve hatırlama olasılığı görünür). |
| **Mondly** | Konuşma tanıma, kısa dersler | Tekrarlayan içerik | Telaffuz alıştırması zaten var (tarayıcı desteğine bağlı). |
| **Rosetta Stone** | Çeviri olmadan görsel öğrenme | Pahalı, yavaş | Görsel testi (emoji) var; sadece Türkçe çeviri sunmak başlangıç kullanıcısı için daha hızlı. |
| **Drops** | Hızlı, görsel, 5 dakikalık oturum | Sınırlı günlük süre, ücret | **Kısa oturum** ve görsel ipucu aldık; süre sınırı koymadık. |
| **LingoDeer** | Net dilbilgisi notları | Kelime tekrarı sınırlı | Kapsam dışı (odak: kelime). |
| **Cake / ELSA** | Telaffuz geri bildirimi, gerçek video | Ücretli, yapay zekâ geri bildirimi tutarsız olabilir | Telaffuzu **tarayıcıya** bıraktık; sahte puan göstermiyoruz. |
| **Anki / Quizlet** | Anki: güçlü aralıklı tekrar, kendi kartların. Quizlet: kolay kart ve oyunlar | Anki: öğrenme eğrisi dik. Quizlet: tekrar zamanlaması zayıf, gereğinden sık tekrar | Anki'nin **gücünü** (aralıklı tekrar), Quizlet'in **kolaylığını** (ayar yok, her şey otomatik) birleştirmeyi hedefledik. |

## Ortak şikâyetler ve bizim yanıtımız

| Şikâyet | Bizde |
|---|---|
| "Seri kaybetmekten korkuyorum" | Seri dondurma var, bildirim baskısı yok, yeni gün kaçırınca ceza değil sakin bir dönüş. |
| "Oyunlaştırma öğrenmeyi gölgeliyor" | XP ikincil; ana ekranda değil **hafıza gücü** ve **kalıcı kelime** sayısı öne çıkıyor. |
| "Çok reklam, paywall, abonelik tuzağı" | Reklam ve abonelik yok. Mağazaya çıkarken bu kararı bilinçli verin. |
| "Konuşma gerçek değil" | Konuşma alıştırması yalnızca destekleyen tarayıcıda; başarı uydurulmaz. |
| "Gereksiz tekrar" | Tekrar zamanı unutmaya göre hesaplanır; sabit takvim yok. |
| "Kafa karıştırıcı" | Ana ekran tek plan + tek "Başla" düğmesi. 12 pratik modundan dördü görünür, kalanı gizli. |

## Fark yaratma noktamız

1. **Görünür hafıza.** Rakiplerde "kelimeyi öğrendin" bir rozettir. Bizde her kelimenin tahmini hatırlama olasılığı, bir sonraki tekrar günü ve aşaması (tohum → filiz → fidan → ağaç) görünür. İnsanlar tekrarın neden gerektiğini görür.
2. **Boğmayan yük.** Tekrarlar birikirse yeni kelime otomatik azalır. Sonuçta kullanıcı "tekrar dağı" yüzünden bırakmaz.
3. **Otomatik not.** Kullanıcıya "ne kadar kolaydı?" diye sorulmaz; doğruluk, hız, ipucu ve yazım yakınlığından hesaplanır.
4. **Türkçe odaklı.** Çoklu Türkçe karşılık, her örnek cümlenin Türkçesi.

## Bilerek almadıklarımız

Can/enerji, lig/sıralama, sosyal arkadaş yarışı, bildirimle suçluluk, süre sınırı, zorunlu hesap. Hepsi ya stres üretiyor ya da özel bir hukuki/teknik yük getiriyor. İleride isteğe bağlı eklenebilir.

## Eklenebilecek sonraki adımlar (öncelik sırasıyla)

1. İnsan gözden geçirmesinden geçmiş çeviriler ve örnek cümleler (yayın öncesi şart, bkz. `HUKUK.md`).
2. Gerçek kullanıcı verisiyle zamanlama sabitlerinin ayarlanması (şu an literatüre göre tahmin).
3. Kelime başına gerçek fotoğraf/illüstrasyon (lisanslı).
4. Hatırlatma bildirimi (isteğe bağlı, tek, sakin).
5. Bulut yedek / cihazlar arası eşitleme.
