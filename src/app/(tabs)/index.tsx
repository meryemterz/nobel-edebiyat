
import { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/AppHeader';

// Nobel Prize API veri yapısı
type NobelKazanan = {
  id: string;

  knownName?: {
    en?: string;
  };

  orgName?: {
    en?: string;
  };

  wikipedia?: {
    english?: string;
  };

  birth?: {
    date?: string;
    place?: {
      country?: {
        en?: string;
      };
    };
  };

  death?: {
    date?: string;
  };

  nobelPrizes?: {
    awardYear?: string;
    motivation?: {
      en?: string;
    };
  }[];
};

type NobelKart = NobelKazanan & {
  fotograf?: string;
};

// Hocanın verdiği Nobel Edebiyat API adresi
const API_URL =
  'https://api.nobelprize.org/2.1/laureates?limit=30&nobelPrizeCategory=lit';

// Uygulama renkleri
const RENK = {
  arkaPlan: '#101C2B',
  kart: '#1B2A3B',
  arama: '#203044',
  altin: '#DAB978',
  beyaz: '#FFFFFF',
  gri: '#AAB7C6',
  kenar: '#35445A',
};

// Yazarın ismini getirir
function yazarAdi(kisi: NobelKazanan): string {
  return (
    kisi.knownName?.en ??
    kisi.orgName?.en ??
    'İsim bilinmiyor'
  );
}

// Yazarın Vikipedi sayfasını bulur
function wikipediaBasligi(kisi: NobelKazanan): string {
  const wikipediaUrl = kisi.wikipedia?.english;

  if (wikipediaUrl) {
    try {
      const url = new URL(wikipediaUrl);
      const baslik = url.pathname.split('/wiki/')[1];

      if (baslik) {
        return decodeURIComponent(baslik).replace(/_/g, ' ');
      }
    } catch {
      // Bağlantı yoksa yazar adını kullan
    }
  }

  return yazarAdi(kisi);
}

// Vikipedi API'sinden yazar fotoğrafını getirir
async function fotografGetir(
  kisi: NobelKazanan
): Promise<string | undefined> {
  try {
    const baslik = wikipediaBasligi(kisi);

    const url =
      'https://en.wikipedia.org/w/api.php?' +
      'action=query' +
      '&prop=pageimages' +
      '&redirects=1' +
      '&format=json' +
      '&formatversion=2' +
      '&pithumbsize=400' +
      '&origin=*' +
      '&titles=' +
      encodeURIComponent(baslik);

    const cevap = await fetch(url);

    if (!cevap.ok) {
      return undefined;
    }

    const veri = await cevap.json();

    return veri.query?.pages?.[0]?.thumbnail?.source;
  } catch (hata) {
    console.log('Fotoğraf alınamadı:', yazarAdi(kisi));
    return undefined;
  }
}

export default function HomeScreen() {
  const router = useRouter();

  const [nobelListesi, setNobelListesi] =
    useState<NobelKart[]>([]);

  const [arama, setArama] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [yenidenDene, setYenidenDene] = useState(0);

  // Nobel API'sinden veri çekme
  useEffect(() => {
    let aktif = true;

    async function verileriGetir() {
      try {
        setYukleniyor(true);
        setHata('');

        const cevap = await fetch(API_URL);

        if (!cevap.ok) {
          throw new Error('Nobel API bağlantı hatası');
        }

        const veri = await cevap.json();

        // Ödül yılına göre yeniden eskiye sıralama
        const siraliListe: NobelKazanan[] = [
          ...(veri.laureates ?? []),
        ].sort(
          (a: NobelKazanan, b: NobelKazanan) =>
            Number(b.nobelPrizes?.[0]?.awardYear ?? 0) -
            Number(a.nobelPrizes?.[0]?.awardYear ?? 0)
        );

        if (!aktif) return;

        setNobelListesi(siraliListe);
        setYukleniyor(false);

        // Fotoğrafları beşerli gruplarla getir
        for (let i = 0; i < siraliListe.length; i += 5) {
          if (!aktif) return;

          const grup = siraliListe.slice(i, i + 5);

          const sonuclar = await Promise.all(
            grup.map(async (kisi) => ({
              id: kisi.id,
              fotograf: await fotografGetir(kisi),
            }))
          );

          if (!aktif) return;

          const fotografHaritasi = new Map(
            sonuclar.map((sonuc) => [
              sonuc.id,
              sonuc.fotograf,
            ])
          );

          setNobelListesi((oncekiListe) =>
            oncekiListe.map((kisi) => ({
              ...kisi,
              fotograf:
                fotografHaritasi.get(kisi.id) ??
                kisi.fotograf,
            }))
          );
        }
      } catch (error) {
        if (aktif) {
          setHata('Nobel arşivine bağlanılamadı.');
          setYukleniyor(false);
        }
      }
    }

    verileriGetir();

    return () => {
      aktif = false;
    };
  }, [yenidenDene]);

  // Büyük/küçük harfe duyarsız arama
  const filtrelenmisListe = useMemo(() => {
    return nobelListesi.filter((kisi) =>
      yazarAdi(kisi)
        .toLocaleLowerCase('tr-TR')
        .includes(
          arama.trim().toLocaleLowerCase('tr-TR')
        )
    );
  }, [nobelListesi, arama]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filtrelenmisListe}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}

        // Ortak üst menü ve Keşfet başlığı
        ListHeaderComponent={
          <>
            <AppHeader />

            <View style={styles.header}>
              <Text style={styles.eyebrow}>
                EDEBİYAT KOLEKSİYONU
              </Text>

              <Text style={styles.title}>
                Kelimelerle{'\n'}iz bırakanlar.
              </Text>

              <Text style={styles.subtitle}>
                Dünyanın en prestijli edebiyat ödülüne
                layık görülen isimleri keşfedin.
              </Text>
            </View>

            {/* Arama kutusu */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>
                ⌕
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Yazar ara..."
                placeholderTextColor={RENK.gri}
                value={arama}
                onChangeText={setArama}
                autoCorrect={false}
                autoCapitalize="none"
              />

              {arama.length > 0 && (
                <Pressable
                  onPress={() => setArama('')}
                  accessibilityLabel="Aramayı temizle"
                >
                  <Text style={styles.clearText}>
                    ✕
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Liste başlığı */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Ödül sahipleri
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Edebiyatın seçkin isimleri
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {filtrelenmisListe.length} kayıt
                </Text>
              </View>
            </View>
          </>
        }

        // Yükleniyor, hata veya boş liste
        ListEmptyComponent={
          <View style={styles.center}>
            {yukleniyor ? (
              <>
                <ActivityIndicator
                  size="large"
                  color={RENK.altin}
                />

                <Text style={styles.info}>
                  Nobel arşivi yükleniyor...
                </Text>
              </>
            ) : hata ? (
              <>
                <Text style={styles.info}>
                  {hata}
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={() =>
                    setYenidenDene((deger) => deger + 1)
                  }
                >
                  <Text style={styles.retryText}>
                    Tekrar dene
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.info}>
                Sonuç bulunamadı.
              </Text>
            )}
          </View>
        }

        // Nobel ödülü sahibi kartı
        renderItem={({ item }) => {
          const ad = yazarAdi(item);

          const yil =
            item.nobelPrizes?.[0]?.awardYear ??
            'Bilinmiyor';

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/detail',
                  params: {
                    item: JSON.stringify(item),
                  },
                })
              }
            >
              <View style={styles.imageContainer}>
                {item.fotograf ? (
                  <Image
                    source={{ uri: item.fotograf }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fallback}>
                    <Text style={styles.fallbackText}>
                      ✦
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>
                  NOBEL EDEBİYAT · {yil}
                </Text>

                <Text
                  style={styles.cardTitle}
                  numberOfLines={2}
                >
                  {ad}
                </Text>

                <Text style={styles.cardSubtitle}>
                  Nobel ödülü sahibi
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>
          );
        }}

        // Sayfanın alt bilgisi
        ListFooterComponent={
          !yukleniyor && !hata ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                NOBEL EDEBİYAT ARŞİVİ
              </Text>

              <Text style={styles.footerSubtext}>
                Veri: Nobel Prize API
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// TASARIM
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RENK.arkaPlan,
  },

  // Sayfanın maksimum genişliği
  listContent: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingBottom: 24,
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 26,
  },

  eyebrow: {
    color: RENK.altin,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },

  title: {
    color: RENK.beyaz,
    fontSize: 34,
    lineHeight: 43,
    fontWeight: 'bold',
    letterSpacing: -0.7,
    marginBottom: 14,
  },

  subtitle: {
    color: RENK.gri,
    fontSize: 14,
    lineHeight: 23,
    maxWidth: 440,
  },

  searchBox: {
    backgroundColor: RENK.arama,
    marginHorizontal: 22,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: RENK.kenar,
  },

  searchIcon: {
    color: RENK.altin,
    fontSize: 27,
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    color: RENK.beyaz,
    fontSize: 15,
    paddingVertical: 10,
  },

  clearText: {
    color: RENK.gri,
    fontSize: 18,
    padding: 6,
  },

  sectionHeader: {
    paddingHorizontal: 22,
    marginTop: 34,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: RENK.beyaz,
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  sectionSubtitle: {
    color: RENK.gri,
    fontSize: 12,
  },

  countBadge: {
    backgroundColor: RENK.arama,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: RENK.kenar,
  },

  countText: {
    color: RENK.altin,
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    marginHorizontal: 22,
    marginBottom: 12,
    backgroundColor: RENK.kart,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 104,
    borderWidth: 1,
    borderColor: RENK.kenar,
  },

  imageContainer: {
    width: 74,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: RENK.kenar,
    marginRight: 14,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RENK.kenar,
  },

  fallbackText: {
    color: RENK.altin,
    fontSize: 29,
  },

  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },

  cardLabel: {
    color: RENK.altin,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  cardTitle: {
    color: RENK.beyaz,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  cardSubtitle: {
    color: RENK.gri,
    fontSize: 12,
  },

  arrow: {
    color: RENK.altin,
    fontSize: 30,
    marginLeft: 7,
    marginRight: 3,
  },

  center: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
  },

  info: {
    color: RENK.gri,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },

  retryButton: {
    backgroundColor: RENK.altin,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },

  retryText: {
    color: RENK.arkaPlan,
    fontWeight: 'bold',
  },

  footer: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },

  footerText: {
    color: RENK.altin,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 'bold',
  },

  footerSubtext: {
    color: RENK.gri,
    fontSize: 11,
    marginTop: 8,
  },
});
