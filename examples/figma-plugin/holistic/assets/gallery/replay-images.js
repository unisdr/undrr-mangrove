(async () => {
  const mapping = {
    'https://picsum.photos/1200/400?random=23': {
      url: 'http://127.0.0.1:6124/picsum-249-1200x400-03ba83f4.jpg',
      file: 'picsum-249-1200x400-03ba83f4.jpg',
      sha256:
        '03ba83f4f54d327c280781ed9e67b1353f4fbb4aee39746f74524e3d7d0e0d20',
      width: 1200,
      height: 400,
    },
    'https://picsum.photos/600/800?random=2': {
      url: 'http://127.0.0.1:6124/picsum-927-600x800-f5838fba.jpg',
      file: 'picsum-927-600x800-f5838fba.jpg',
      sha256:
        'f5838fbae9de3c22b4044698a388ef8429b1c0ca61a39d5dc086fa439b7b3c84',
      width: 600,
      height: 800,
    },
    'https://picsum.photos/600/800?random=21': {
      url: 'http://127.0.0.1:6124/picsum-965-600x800-420df51e.jpg',
      file: 'picsum-965-600x800-420df51e.jpg',
      sha256:
        '420df51ec3ab5775162f2b71888c6784c6441957c85c69a3e2d328bd2ab568dc',
      width: 600,
      height: 800,
    },
    'https://picsum.photos/800/600?random=1': {
      url: 'http://127.0.0.1:6124/picsum-161-800x600-f6743b7f.jpg',
      file: 'picsum-161-800x600-f6743b7f.jpg',
      sha256:
        'f6743b7f1ec502f15dbeed012a96c1f62c361f279717a4b3442dbd0007378efd',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=10': {
      url: 'http://127.0.0.1:6124/picsum-459-800x600-ca89e014.jpg',
      file: 'picsum-459-800x600-ca89e014.jpg',
      sha256:
        'ca89e01467cf90825af617672f60a152ebcb2805f22d798e82fab0c27dfe898a',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=11': {
      url: 'http://127.0.0.1:6124/picsum-295-800x600-2c080ca1.jpg',
      file: 'picsum-295-800x600-2c080ca1.jpg',
      sha256:
        '2c080ca136288281024fd55e8a2aeefc36b3bb2687b7ae685dcd4bb79f656a9c',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=12': {
      url: 'http://127.0.0.1:6124/picsum-1005-800x600-0014a01e.jpg',
      file: 'picsum-1005-800x600-0014a01e.jpg',
      sha256:
        '0014a01e7f4884c1eff0449a5d1d54112552a8108e05254755078ec4afa3c0f2',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=13': {
      url: 'http://127.0.0.1:6124/picsum-972-800x600-269fd29b.jpg',
      file: 'picsum-972-800x600-269fd29b.jpg',
      sha256:
        '269fd29b7bc63febcf4fd3e26a02e7d5d2df3527f989ecb653fe82515e6bacd1',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=14': {
      url: 'http://127.0.0.1:6124/picsum-147-800x600-5cfde46e.jpg',
      file: 'picsum-147-800x600-5cfde46e.jpg',
      sha256:
        '5cfde46e69a977855a896a73498be998a44db69690734daffea9924e62443ad1',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=15': {
      url: 'http://127.0.0.1:6124/picsum-273-800x600-16b504c9.jpg',
      file: 'picsum-273-800x600-16b504c9.jpg',
      sha256:
        '16b504c9616ac95fa4b857902fcae5fddc34a0a6c3237b8ee571c87e27fc3ab6',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=16': {
      url: 'http://127.0.0.1:6124/picsum-883-800x600-d77c26ee.jpg',
      file: 'picsum-883-800x600-d77c26ee.jpg',
      sha256:
        'd77c26ee734c2f92c7843eb0c33eb13852bc3c709a10ab7d9473fe3d9d2053a4',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=17': {
      url: 'http://127.0.0.1:6124/picsum-924-800x600-01de7c91.jpg',
      file: 'picsum-924-800x600-01de7c91.jpg',
      sha256:
        '01de7c91148d03c4d80183c90e514417d08e9fb78c2079415a85cffc9a9fbcdb',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=18': {
      url: 'http://127.0.0.1:6124/picsum-809-800x600-19ff867a.jpg',
      file: 'picsum-809-800x600-19ff867a.jpg',
      sha256:
        '19ff867ace6afed121257b7322526a0eac322db10b63b968bd499ab055632db2',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=19': {
      url: 'http://127.0.0.1:6124/picsum-649-800x600-ab4d2c45.jpg',
      file: 'picsum-649-800x600-ab4d2c45.jpg',
      sha256:
        'ab4d2c450d6c63fdb2704b6b714769e14f8e0c73d327fd74f016ec2f93929041',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=20': {
      url: 'http://127.0.0.1:6124/picsum-345-800x600-3395b604.jpg',
      file: 'picsum-345-800x600-3395b604.jpg',
      sha256:
        '3395b604496e8f02acde21af09f34be4acdd019fd4c1b295ba84ca2192c37540',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=21': {
      url: 'http://127.0.0.1:6124/picsum-576-800x600-8bc24d98.jpg',
      file: 'picsum-576-800x600-8bc24d98.jpg',
      sha256:
        '8bc24d980e576780cf89df516138027eb39c9844096082e8ba532017460f27fc',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=3': {
      url: 'http://127.0.0.1:6124/picsum-570-800x600-f1cf462a.jpg',
      file: 'picsum-570-800x600-f1cf462a.jpg',
      sha256:
        'f1cf462ae359d1e045b7b61177b28330c91aa64fb2acc2da965f9f72c99c557a',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=30': {
      url: 'http://127.0.0.1:6124/picsum-512-800x600-e72e6c61.jpg',
      file: 'picsum-512-800x600-e72e6c61.jpg',
      sha256:
        'e72e6c618527f189cbbd4208e88221a0b85ff383cd1d14f73be40cc1b3a6f457',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=31': {
      url: 'http://127.0.0.1:6124/picsum-933-800x600-7acc6499.jpg',
      file: 'picsum-933-800x600-7acc6499.jpg',
      sha256:
        '7acc649981436eaf23ab84b3ccc2548fc4dcea44feb00875d2ff9ff7b019a283',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=32': {
      url: 'http://127.0.0.1:6124/picsum-693-800x600-db5a1c8b.jpg',
      file: 'picsum-693-800x600-db5a1c8b.jpg',
      sha256:
        'db5a1c8b3fe91557816b4ee9b17866e0d539a7f5b88c9b4c94fb53d43fb95134',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=33': {
      url: 'http://127.0.0.1:6124/picsum-134-800x600-4264b7ea.jpg',
      file: 'picsum-134-800x600-4264b7ea.jpg',
      sha256:
        '4264b7ea44f4e946e2204b962917bfc28594b443a9bf7a26b3626d4e13ceea3c',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=40': {
      url: 'http://127.0.0.1:6124/picsum-486-800x600-cb241091.jpg',
      file: 'picsum-486-800x600-cb241091.jpg',
      sha256:
        'cb241091900d0707609cb0e6a250ea8467a7690feef754b0419e9119264cb2f7',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/600?random=42': {
      url: 'http://127.0.0.1:6124/picsum-930-800x600-ed290189.jpg',
      file: 'picsum-930-800x600-ed290189.jpg',
      sha256:
        'ed290189e7f8a8ef6bdc43996ffa54096f8031bc320a053a5c1aec4e68a07bdd',
      width: 800,
      height: 600,
    },
    'https://picsum.photos/800/800?random=22': {
      url: 'http://127.0.0.1:6124/picsum-802-800x800-ab05c763.jpg',
      file: 'picsum-802-800x800-ab05c763.jpg',
      sha256:
        'ab05c76346f183cd90261ee22adafaf06d051801d7cdbe7a7060194c6a67100d',
      width: 800,
      height: 800,
    },
  };
  const touched = [];
  for (const image of document.querySelectorAll('.mg-gallery img')) {
    const original = image.src.startsWith('https://picsum.photos/')
      ? image.src
      : image.dataset.galleryAuthoredSrc || image.src;
    const pinned = mapping[original];
    if (!pinned) throw Error('Unpinned authored image ' + original);
    image.dataset.galleryAuthoredSrc = original;
    image.dataset.galleryFixtureFile = pinned.file;
    image.dataset.galleryFixtureSha256 = pinned.sha256;
    image.loading = 'eager';
    image.src = pinned.url;
    await image.decode();
    touched.push({
      authoredUrl: original,
      file: pinned.file,
      sha256: pinned.sha256,
    });
  }
  await Promise.all(
    Array.from(document.querySelectorAll('.mg-gallery img'), n => n.decode())
  );
  for (const image of document.querySelectorAll('.mg-gallery img')) {
    const pin = mapping[image.dataset.galleryAuthoredSrc];
    if (image.naturalWidth !== pin.width || image.naturalHeight !== pin.height)
      throw Error('Pinned response dimensions changed');
  }
  return JSON.stringify({
    kind: 'pinned-actual-media-response-fixture',
    componentCodeUnmodified: true,
    mediaSrcRemapped: true,
    touched,
  });
})();
