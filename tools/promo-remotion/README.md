# Kelime Bahçesi tanıtım videosu (Remotion)

1. `npm install`
2. Sesi üret: `python3 audio_tr.py <vits-piper-tr_TR-fahrettin-medium klasörü> public` (müzik + Türkçe seslendirme + `public/vo.json`; sahne süreleri vo.json'dan türer)
3. Gerçek uygulama ekranlarını yenile: uygulamayı `http://localhost:8080` üzerinde aç, `node capture.cjs`
4. Render: `node render.mjs out/tanitim.mp4` (tek kare: `node render.mjs out/kare.png 120`). Tarayıcı yolu `CHROME` ile değiştirilebilir.

Seslendirmeyi kendi kaydınla değiştirmek için `public/audio/vo.wav` yerine koy ve `mix.wav`'ı müzikle yeniden karıştır; cümle zamanları `public/vo.json`'da.
Remotion lisansı: bireyler ve en fazla 3 kişilik şirketler için ücretsiz; daha büyük ekipler ticari lisans almalı.
