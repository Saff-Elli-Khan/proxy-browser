#!/bin/bash

# Browser 1
nohup ts-node -T ./index.ts -w "https://lifestylescorner.com" --referer="https://search.yahoo.com,https://www.bing.com/,https://www.facebook.com/,," --no-tor --limit 150 --useKnownDevices --useGeneratedDevices --useStaticDevices --scrapeIps --searchStrategy="google" --searchQuery="Lifestyles Corner" --timeframeMs="86400000-(new Date()%86400000)" >browser-1.out 2>&1 &
pid1=$!
echo "Browser 1 PID: $pid1"

# # Browser 1
# nohup ts-node -T ./index.ts -w "https://www.highrevenuegate.com/i96kys53x?key=fbfa4678dece4dd1392c41cd1c400529,https://www.highrevenuegate.com/i96kys53x?key=fbfa4678dece4dd1392c41cd1c400529,https://www.highrevenuegate.com/u2k1esirj0?key=4442e4a977734bf8cb5398c5556a1f93,https://www.highrevenuegate.com/g9nad7ean?key=8ca5cb28185dc03db847d8b8b469ac61,https://www.highrevenuegate.com/nrwq43apv?key=8f0f82edcf0c065a3bf8fab68de3d7e1,https://www.highrevenuegate.com/i2ut3w1ph7?key=da7b2e304d16c8c024236d9de1d077a0,https://www.highrevenuegate.com/zvibxwc3?key=e34275d4c4b2b865365d4c67d98496be,https://www.highrevenuegate.com/i1sr0wn7?key=be57871b6e1a6349fdca9ebfbbe26691,https://www.highrevenuegate.com/mx2ugcbp?key=79a8da8c2c6a6fd9c6777dc872d837d3,https://www.highrevenuegate.com/zg48aahf?key=271c4ecae8223e2721c4eb04813dfd9a,https://www.highrevenuegate.com/jhv9hd5x98?key=b9f37be332c36a647dcbedcc8ce582e4,https://www.highrevenuegate.com/pb2adz7q87?key=373086b152ab6134eb3efc148052959e,https://www.highrevenuegate.com/kry82xah?key=45f4d695736216a8ba698550f9e238be,https://www.highrevenuegate.com/iur60us8qm?key=4be9c880fc7f6d261209d8cdf03ccab1,https://www.highrevenuegate.com/z1sbr5tajb?key=fc6d00d7d188f984d72650b4a81e6f5b,https://www.highrevenuegate.com/p4ntqt28?key=e39c4a254dda4bf620a3b661473bad2b,https://www.highrevenuegate.com/xna6z9w11i?key=acb31c987cdb925589e8c3252b7d92ca,https://www.highrevenuegate.com/p9ppeb2a?key=d038b8468f901a23a0a8c97a0bfd1ac9,https://www.highrevenuegate.com/bf6zx9a1?key=2451bf1f5256cc2ec7462350bbc866ae,https://www.highrevenuegate.com/ks35e4si?key=228788643db3869691264d16bae2e77b, https://www.highrevenuegate.com/cn7stmi9?key=6b15b223b5bad95e61cea8813239a6ac,https://www.highrevenuegate.com/iafcvypyqf?key=d98aca0569426156e00f19ad8ac04968,https://www.highrevenuegate.com/shxbwtv9d?key=577a5f378292389bed5940b03b9bcba1,https://www.highrevenuegate.com/jtq8r0hk?key=b1917d50a66092f45532190bab576d7f,https://www.highrevenuegate.com/fbie6bq6bp?key=4ff9a1266da45bab5021d159e1e2305b,https://www.highrevenuegate.com/s1aq1t4je?key=b8bea30bb40d70fe334c781142edadc4,https://www.highrevenuegate.com/z9e8e71x?key=6efb425914c8374ec5a7d367d6198c0d,https://www.highrevenuegate.com/biuhs5fv1?key=5073c2e9c04235af2e0261d448bda9de,https://www.highrevenuegate.com/uexiggkf8?key=3f1cc1b928461ca35d914b08fdf2983a,https://www.highrevenuegate.com/fdmk30r96g?key=d10a298cea55cf133d38ce25b889ec4d,https://www.highrevenuegate.com/n5hngpijw?key=07ae52db7fb3a1f84f9c0294646b6226,https://www.highrevenuegate.com/k8zip9npr?key=2e95fc1006c35054cf31e10ea7dbffe7,https://www.highrevenuegate.com/t017iypmir?key=08720ed1cc66239b30078be41ec17997,https://www.highrevenuegate.com/k8p9id1azu?key=684f4a39cd53c45b181e5cb03f90fbd9,https://www.highrevenuegate.com/r9bq028e?key=ea23d0ae85979109f503c3af24bea461,https://www.highrevenuegate.com/edkwefw6?key=d47abd717f725857bdec2f4d9d350dbc,https://www.highrevenuegate.com/yfbf4djw?key=cf7790f5c72412b5684a527cc0497640,https://www.highrevenuegate.com/c0uk67rk7?key=e26dc47ed63e60effbc5b75d7e1cee61,https://www.highrevenuegate.com/w26ga6d0?key=14fdd14c93d19a2c0c19c0f50f8bec0b,https://www.highrevenuegate.com/xfv9kjz1u?key=e1fa7d8febf7ade2678c65708e3d37fc" --referer="https://lifestylescorner.com,https://www.google.com,https://search.yahoo.com," --proxyList=./ips/04-06-2023_ips.txt --proxyListProtocol=socks5 --limit 100000 --no-searchQuery --strategy 0 --useKnownDevices >browser-1.out 2>&1 &
# pid1=$!
# echo "Browser 1 PID: $pid1"

# # Browser 2
# nohup ts-node -T ./index.ts -w "https://www.highrevenuegate.com/i96kys53x?key=fbfa4678dece4dd1392c41cd1c400529,https://www.highrevenuegate.com/i96kys53x?key=fbfa4678dece4dd1392c41cd1c400529,https://www.highrevenuegate.com/u2k1esirj0?key=4442e4a977734bf8cb5398c5556a1f93,https://www.highrevenuegate.com/g9nad7ean?key=8ca5cb28185dc03db847d8b8b469ac61,https://www.highrevenuegate.com/nrwq43apv?key=8f0f82edcf0c065a3bf8fab68de3d7e1,https://www.highrevenuegate.com/i2ut3w1ph7?key=da7b2e304d16c8c024236d9de1d077a0,https://www.highrevenuegate.com/zvibxwc3?key=e34275d4c4b2b865365d4c67d98496be,https://www.highrevenuegate.com/i1sr0wn7?key=be57871b6e1a6349fdca9ebfbbe26691,https://www.highrevenuegate.com/mx2ugcbp?key=79a8da8c2c6a6fd9c6777dc872d837d3,https://www.highrevenuegate.com/zg48aahf?key=271c4ecae8223e2721c4eb04813dfd9a,https://www.highrevenuegate.com/jhv9hd5x98?key=b9f37be332c36a647dcbedcc8ce582e4,https://www.highrevenuegate.com/pb2adz7q87?key=373086b152ab6134eb3efc148052959e,https://www.highrevenuegate.com/kry82xah?key=45f4d695736216a8ba698550f9e238be,https://www.highrevenuegate.com/iur60us8qm?key=4be9c880fc7f6d261209d8cdf03ccab1,https://www.highrevenuegate.com/z1sbr5tajb?key=fc6d00d7d188f984d72650b4a81e6f5b,https://www.highrevenuegate.com/p4ntqt28?key=e39c4a254dda4bf620a3b661473bad2b,https://www.highrevenuegate.com/xna6z9w11i?key=acb31c987cdb925589e8c3252b7d92ca,https://www.highrevenuegate.com/p9ppeb2a?key=d038b8468f901a23a0a8c97a0bfd1ac9,https://www.highrevenuegate.com/bf6zx9a1?key=2451bf1f5256cc2ec7462350bbc866ae,https://www.highrevenuegate.com/ks35e4si?key=228788643db3869691264d16bae2e77b, https://www.highrevenuegate.com/cn7stmi9?key=6b15b223b5bad95e61cea8813239a6ac,https://www.highrevenuegate.com/iafcvypyqf?key=d98aca0569426156e00f19ad8ac04968,https://www.highrevenuegate.com/shxbwtv9d?key=577a5f378292389bed5940b03b9bcba1,https://www.highrevenuegate.com/jtq8r0hk?key=b1917d50a66092f45532190bab576d7f,https://www.highrevenuegate.com/fbie6bq6bp?key=4ff9a1266da45bab5021d159e1e2305b,https://www.highrevenuegate.com/s1aq1t4je?key=b8bea30bb40d70fe334c781142edadc4,https://www.highrevenuegate.com/z9e8e71x?key=6efb425914c8374ec5a7d367d6198c0d,https://www.highrevenuegate.com/biuhs5fv1?key=5073c2e9c04235af2e0261d448bda9de,https://www.highrevenuegate.com/uexiggkf8?key=3f1cc1b928461ca35d914b08fdf2983a,https://www.highrevenuegate.com/fdmk30r96g?key=d10a298cea55cf133d38ce25b889ec4d,https://www.highrevenuegate.com/n5hngpijw?key=07ae52db7fb3a1f84f9c0294646b6226,https://www.highrevenuegate.com/k8zip9npr?key=2e95fc1006c35054cf31e10ea7dbffe7,https://www.highrevenuegate.com/t017iypmir?key=08720ed1cc66239b30078be41ec17997,https://www.highrevenuegate.com/k8p9id1azu?key=684f4a39cd53c45b181e5cb03f90fbd9,https://www.highrevenuegate.com/r9bq028e?key=ea23d0ae85979109f503c3af24bea461,https://www.highrevenuegate.com/edkwefw6?key=d47abd717f725857bdec2f4d9d350dbc,https://www.highrevenuegate.com/yfbf4djw?key=cf7790f5c72412b5684a527cc0497640,https://www.highrevenuegate.com/c0uk67rk7?key=e26dc47ed63e60effbc5b75d7e1cee61,https://www.highrevenuegate.com/w26ga6d0?key=14fdd14c93d19a2c0c19c0f50f8bec0b,https://www.highrevenuegate.com/xfv9kjz1u?key=e1fa7d8febf7ade2678c65708e3d37fc" --referer="https://lifestylescorner.com,https://www.google.com,https://search.yahoo.com," --proxyList=./ips/04-06-2023_ips.txt --proxyListProtocol=socks5 --limit 100000 --no-searchQuery --strategy 0 --useKnownDevices >browser-2.out 2>&1 &
# pid2=$!
# echo "Browser 2 PID: $pid2"

# All processes successfully started.
echo "All commands have been launched in the background."
