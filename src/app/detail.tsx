
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  kayitliMi,
  yazarKaydet,
  type KaydedilenYazar,
} from '../services/kayitlar';

// UYGULAMA RENKLERİ
const RENK = {
  arkaPlan: '#101C2B',
  kart: '#1B2A3B',
  altin: '#DAB978',
  beyaz: '#FFFFFF',
  gri: '#AAB7C6',
  kenar: '#35445A',
};

// ÜLKE İSİMLERİ
const ulkeler: Record<string, string> = {
  France: 'Fransa',
  Canada: 'Kanada',
  Germany: 'Almanya',
  Sweden: 'İsveç',
  Norway: 'Norveç',
  Italy: 'İtalya',
  Spain: 'İspanya',
  Poland: 'Polonya',
  Japan: 'Japonya',
  China: 'Çin',
  Russia: 'Rusya',
  India: 'Hindistan',
  Turkey: 'Türkiye',
  Türkiye: 'Türkiye',
  'United States': 'Amerika Birleşik Devletleri',
  'United Kingdom': 'Birleşik Krallık',
  'French Algeria': 'Fransız Cezayiri',
};

// TARİHİ TÜRKÇE BİÇİMLENDİRME
function tarihBicimlendir(tarih?: string): string {
  if (!tarih) {
    return 'Bilinmiyor';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
    return tarih;
  }

  const [yil, ay, gun] = tarih.split('-').map(Number);

  const date = new Date(yil, ay - 1, gun);

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// TAM TARİHLERDEN YAŞ HESAPLAMA
function yasHesapla(
  dogumTarihi?: string,
  bitisTarihi?: string
): number | null {
  if (!dogumTarihi) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi)) {
    return null;
  }

  const [dy, da, dg] = dogumTarihi.split('-').map(Number);

  // Bitiş tarihi verilmezse cihazın güncel tarihi kullanılır
  let by: number;
  let ba: number;
  let bg: number;

  if (bitisTarihi) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bitisTarihi)) {
      return null;
    }

    [by, ba, bg] = bitisTarihi.split('-').map(Number);
  } else {
    const bugun = new Date();

    by = bugun.getFullYear();
    ba = bugun.getMonth() + 1;
    bg = bugun.getDate();
  }

  let yas = by - dy;

  // O yıl doğum günü henüz gelmemişse bir yaş çıkar
  if (ba < da || (ba === da && bg < dg)) {
    yas--;
  }

  return yas >= 0 ? yas : null;
}

// KÜÇÜK BİLGİ KARTI
function BilgiKarti({
  baslik,
  deger,
}: {
  baslik: string;
  deger: string;
}) {
  return (
    <View style={styles.bilgiKarti}>
      <Text style={styles.bilgiBaslik}>
        {baslik}
      </Text>

      <Text style={styles.bilgiDeger}>
        {deger}
      </Text>
    </View>
  );
}

// YAŞ KARTI
function YasKarti({
  baslik,
  yas,
  aciklama,
}: {
  baslik: string;
  yas: string;
  aciklama: string;
}) {
  return (
    <View style={styles.yasKarti}>
      <Text style={styles.yasBaslik}>
        {baslik}
      </Text>

      <Text style={styles.yasDeger}>
        {yas}
      </Text>

      <Text style={styles.yasAciklama}>
        {aciklama}
      </Text>
    </View>
  );
}

export default function DetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    item?: string;
  }>();

  const { width } = useWindowDimensions();

  const genisEkran = width >= 720;

  const [kaydedildi, setKaydedildi] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // NAVİGASYONDAN GELEN YAZAR
  const kisi = useMemo<KaydedilenYazar | null>(() => {
    try {
      if (typeof params.item !== 'string') {
        return null;
      }

      const veri = JSON.parse(params.item);

      if (
        !veri ||
        typeof veri.id !== 'string'
      ) {
        return null;
      }

      return veri as KaydedilenYazar;
    } catch {
      return null;
    }
  }, [params.item]);

  // GERİ DÖNÜŞ İŞLEMİ
  function geriDon() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  // KAYIT DURUMUNU KONTROL ET
  useEffect(() => {
    let aktif = true;

    setKaydedildi(false);

    async function kayitKontrol() {
      if (!kisi) {
        return;
      }

      try {
        const durum = await kayitliMi(kisi.id);

        if (aktif) {
          setKaydedildi(durum);
        }
      } catch (hata) {
        console.log('Kayıt kontrol hatası:', hata);
      }
    }

    kayitKontrol();

    return () => {
      aktif = false;
    };
  }, [kisi?.id]);

  // KALICI OLARAK KAYDET
  async function kaydet() {
    if (!kisi || kaydedildi || kaydediliyor) {
      return;
    }

    try {
      setKaydediliyor(true);

      await yazarKaydet(kisi);

      setKaydedildi(true);
    } catch (hata) {
      console.log('Kaydetme hatası:', hata);

      if (Platform.OS === 'web') {
        console.error('Yazar kaydedilemedi.');
      } else {
        Alert.alert(
          'Hata',
          'Yazar kaydedilemedi. Tekrar deneyin.'
        );
      }
    } finally {
      setKaydediliyor(false);
    }
  }

  // YAZAR BİLGİLERİ BULUNAMADIYSA
  if (!kisi) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hataAlani}>
          <Text style={styles.hataYazi}>
            Yazar bilgileri bulunamadı.
          </Text>

          <Pressable onPress={geriDon}>
            <Text style={styles.geriYazi}>
              Arşive dön
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // YAZARIN ADI
  const ad =
    kisi.knownName?.en ??
    kisi.orgName?.en ??
    'İsim bilinmiyor';

  // NOBEL ÖDÜLÜ BİLGİLERİ
  const odul = kisi.nobelPrizes?.[0];

  const yil = odul?.awardYear ?? 'Bilinmiyor';

  const gerekce =
    odul?.motivation?.en ??
    'Ödül gerekçesi bulunamadı.';

  // DOĞUM VE VEFAT BİLGİLERİ
  const dogum = kisi.birth?.date;

  const vefat = kisi.death?.date;

  const ulkeIng =
    kisi.birth?.place?.country?.en ??
    'Bilinmiyor';

  const ulke = ulkeler[ulkeIng] ?? ulkeIng;

  // ÖDÜL ALDIĞI YAŞ (YIL FARKINDAN YAKLAŞIK)
  const dogumYili = dogum
    ? Number(dogum.slice(0, 4))
    : NaN;

  const odulYili = Number(yil);

  const odulYasi =
    Number.isFinite(dogumYili) &&
    Number.isFinite(odulYili) &&
    dogumYili > 0
      ? odulYili - dogumYili
      : null;

  // GÜNCEL YAŞ VEYA VEFAT YAŞI
  const yasBilgisi = yasHesapla(
    dogum,
    vefat
  );

  const ikinciYasBasligi = vefat
    ? 'VEFAT YAŞI'
    : 'GÜNCEL YAŞ';

  const ikinciYasAciklama = vefat
    ? tarihBicimlendir(vefat)
    : 'Bugün itibarıyla';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>

          {/* ÜST MENÜ */}
          <View style={styles.ustBar}>
            <Pressable
              onPress={geriDon}
              style={styles.geriButon}
            >
              <Text style={styles.geriYazi}>
                ‹  Arşive dön
              </Text>
            </Pressable>

            {genisEkran && (
              <Text style={styles.marka}>
                NOBEL EDEBİYAT ARŞİVİ
              </Text>
            )}
          </View>

          <View style={styles.cizgi} />

          {/* PORTRE VE YAZAR BİLGİLERİ */}
          <View
            style={[
              styles.hero,
              {
                flexDirection: genisEkran
                  ? 'row'
                  : 'column',
              },
            ]}
          >
            <View
              style={[
                styles.portreAlani,
                {
                  width: genisEkran ? 285 : '100%',
                  height: genisEkran ? 365 : 310,
                },
              ]}
            >
              {kisi.fotograf ? (
                <Image
                  source={{ uri: kisi.fotograf }}
                  style={styles.portre}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.portreSimge}>
                  ✦
                </Text>
              )}
            </View>

            <View style={styles.heroBilgi}>
              <Text style={styles.kategori}>
                NOBEL EDEBİYAT · {yil}
              </Text>

              <Text
                style={[
                  styles.isim,
                  {
                    fontSize: genisEkran ? 43 : 33,
                    lineHeight: genisEkran ? 52 : 41,
                  },
                ]}
              >
                {ad}
              </Text>

              <Text style={styles.aciklama}>
                Nobel Edebiyat Ödülü sahibi
              </Text>

              <View style={styles.heroCizgi} />

              {/* İKİ YAŞ KARTI */}
              <View style={styles.yasKartlari}>
                <YasKarti
                  baslik="ÖDÜLÜ ALDIĞI YAŞ"
                  yas={
                    odulYasi !== null
                      ? String(odulYasi)
                      : '—'
                  }
                  aciklama={`${yil} · Yaklaşık`}
                />

                <YasKarti
                  baslik={ikinciYasBasligi}
                  yas={
                    yasBilgisi !== null
                      ? String(yasBilgisi)
                      : '—'
                  }
                  aciklama={ikinciYasAciklama}
                />
              </View>

              <Text style={styles.yasCumlesi}>
                {odulYasi !== null
                  ? `Ödülü yaklaşık ${odulYasi} yaşında aldı.`
                  : 'Ödül yaşı hesaplanamadı.'}
              </Text>
            </View>
          </View>

          {/* DOĞUM BİLGİLERİ */}
          <View style={styles.bilgiSatiri}>
            <View style={styles.bilgiSutunu}>
              <BilgiKarti
                baslik="DOĞUM TARİHİ"
                deger={tarihBicimlendir(dogum)}
              />
            </View>

            <View style={styles.bilgiSutunu}>
              <BilgiKarti
                baslik="DOĞUM ÜLKESİ"
                deger={ulke}
              />
            </View>
          </View>

          {/* ÖDÜL GEREKÇESİ */}
          <View style={styles.gerekceBolumu}>
            <View style={styles.bolumBaslikSatiri}>
              <View style={styles.altinCizgi} />

              <Text style={styles.bolumBaslik}>
                Ödül Gerekçesi
              </Text>
            </View>

            <Text style={styles.gerekceMetni}>
              {gerekce}
            </Text>

            <Text style={styles.kaynakBilgisi}>
              Kaynak: Nobel Prize API · Özgün İngilizce metin
            </Text>
          </View>

          {/* KAYDETME VE VİKİPEDİ */}
          <View style={styles.butonlar}>
            <Pressable
              style={[
                styles.kaydetButon,
                kaydedildi && styles.kaydedildiButon,
              ]}
              onPress={kaydet}
              disabled={kaydedildi || kaydediliyor}
            >
              <Text
                style={[
                  styles.kaydetYazi,
                  kaydedildi && styles.kaydedildiYazi,
                ]}
              >
                {kaydediliyor
                  ? 'Kaydediliyor...'
                  : kaydedildi
                    ? '✓ Kaydedildi'
                    : '♡ Kaydedilenlere Ekle'}
              </Text>
            </Pressable>

            {kisi.wikipedia?.english && (
              <Pressable
                style={styles.vikipediButon}
                onPress={() =>
                  Linking.openURL(
                    kisi.wikipedia!.english!
                  )
                }
              >
                <Text style={styles.vikipediYazi}>
                  Vikipedi'de İncele ↗
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.altBilgi}>
            NOBEL EDEBİYAT ARŞİVİ
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RENK.arkaPlan,
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 55,
  },

  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  geriButon: {
    paddingVertical: 5,
  },

  geriYazi: {
    color: RENK.altin,
    fontSize: 15,
    fontWeight: '600',
  },

  marka: {
    color: RENK.gri,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '600',
  },

  cizgi: {
    height: 1,
    backgroundColor: RENK.kenar,
    marginBottom: 32,
  },

  hero: {
    gap: 30,
    marginBottom: 30,
    alignItems: 'stretch',
  },

  portreAlani: {
    backgroundColor: RENK.kart,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: RENK.kenar,
  },

  portre: {
    width: '100%',
    height: '100%',
  },

  portreSimge: {
    color: RENK.altin,
    fontSize: 80,
  },

  heroBilgi: {
    flex: 1,
    justifyContent: 'center',
  },

  kategori: {
    color: RENK.altin,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  isim: {
    color: RENK.beyaz,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: -0.8,
  },

  aciklama: {
    color: RENK.gri,
    fontSize: 16,
    lineHeight: 25,
  },

  heroCizgi: {
    height: 1,
    backgroundColor: RENK.kenar,
    marginVertical: 25,
  },

  // YAŞ KARTLARI
  yasKartlari: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },

  yasKarti: {
    flex: 1,
    minWidth: 0,
    backgroundColor: RENK.kart,
    borderWidth: 1,
    borderColor: RENK.kenar,
    borderRadius: 14,
    padding: 15,
    justifyContent: 'center',
  },

  yasBaslik: {
    color: RENK.altin,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    marginBottom: 12,
  },

  yasDeger: {
    color: RENK.beyaz,
    fontSize: 32,
    fontWeight: 'bold',
  },

  yasAciklama: {
    color: RENK.gri,
    fontSize: 11,
    marginTop: 10,
  },

  yasCumlesi: {
    color: RENK.altin,
    fontSize: 13,
    lineHeight: 20,
  },

  // DOĞUM BİLGİLERİ
  bilgiSatiri: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 34,
  },

  bilgiSutunu: {
    flex: 1,
    minWidth: 0,
  },

  bilgiKarti: {
    backgroundColor: RENK.kart,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RENK.kenar,
    padding: 17,
    minHeight: 100,
    justifyContent: 'center',
  },

  bilgiBaslik: {
    color: RENK.altin,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 11,
  },

  bilgiDeger: {
    color: RENK.beyaz,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },

  // ÖDÜL GEREKÇESİ
  gerekceBolumu: {
    marginBottom: 28,
  },

  bolumBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },

  altinCizgi: {
    width: 3,
    height: 25,
    borderRadius: 3,
    backgroundColor: RENK.altin,
  },

  bolumBaslik: {
    color: RENK.beyaz,
    fontSize: 22,
    fontWeight: 'bold',
  },

  gerekceMetni: {
    color: '#DEE5EC',
    fontSize: 16,
    lineHeight: 28,
  },

  kaynakBilgisi: {
    color: RENK.gri,
    fontSize: 11,
    marginTop: 16,
  },

  // BUTONLAR
  butonlar: {
    gap: 12,
  },

  kaydetButon: {
    backgroundColor: RENK.altin,
    minHeight: 56,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  kaydetYazi: {
    color: RENK.arkaPlan,
    fontSize: 16,
    fontWeight: 'bold',
  },

  kaydedildiButon: {
    backgroundColor: RENK.kart,
    borderWidth: 1,
    borderColor: RENK.altin,
  },

  kaydedildiYazi: {
    color: RENK.altin,
  },

  vikipediButon: {
    borderWidth: 1,
    borderColor: RENK.kenar,
    minHeight: 54,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  vikipediYazi: {
    color: RENK.altin,
    fontSize: 15,
    fontWeight: '600',
  },

  altBilgi: {
    color: RENK.gri,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 10,
    letterSpacing: 2,
  },

  // HATA EKRANI
  hataAlani: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  hataYazi: {
    color: RENK.beyaz,
    fontSize: 16,
  },
});
