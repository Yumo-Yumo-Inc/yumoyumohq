/**
 * Master registry of well-known retail chains for the insights logo feature.
 *
 * This is the single source of truth for the curated chain list. The DB table
 * `merchant_logos` (migration 084) is seeded from this list, and the logo
 * collection script reads it to fetch and store each brand's logo asset.
 *
 * Each entry:
 *  - brandKey:     folded lowercase canonical key (unique, used for matching).
 *  - displayName:  human label.
 *  - domain:       brand website (used as the logo source when collecting).
 *  - category:     coarse grouping (grocery, cafe, fuel, marketplace, ...).
 *  - aliases:      folded name variants (OCR/legal/branch forms) that resolve
 *                  to this brand. The first token of a receipt name is also
 *                  matched against brandKey as a fallback.
 *
 * Only large, recognizable chains belong here. Small/independent merchants are
 * intentionally absent — they fall back to the icon. We never invent a logo.
 *
 * The list is curated by hand and complemented by real-data frequency
 * (see scripts output merchant_frequency.sql): chains that appear often in
 * real receipts but are missing here get added with source='frequency'.
 */

export type MerchantCategory =
  | "grocery"
  | "cafe"
  | "restaurant"
  | "fuel"
  | "marketplace"
  | "pharmacy"
  | "electronics"
  | "apparel"
  | "home"
  | "sports"
  | "kids"
  | "books"
  | "other";

export interface MasterMerchant {
  brandKey: string;
  displayName: string;
  domain: string;
  category: MerchantCategory;
  aliases: string[];
}

export const MASTER_MERCHANTS: MasterMerchant[] = [
  { brandKey: "migros", displayName: "Migros", domain: "migros.com.tr", category: "grocery", aliases: ["migros ticaret", "migros jet", "mmm migros", "5m migros", "migros m"] },
  { brandKey: "bim", displayName: "BİM", domain: "bim.com.tr", category: "grocery", aliases: ["bim", "bim birlesik magazalar"] },
  { brandKey: "sok", displayName: "ŞOK", domain: "sokmarket.com.tr", category: "grocery", aliases: ["sok", "sok marketler", "sok market"] },
  { brandKey: "a101", displayName: "A101", domain: "a101.com.tr", category: "grocery", aliases: ["a101", "a 101"] },
  { brandKey: "carrefoursa", displayName: "CarrefourSA", domain: "carrefoursa.com", category: "grocery", aliases: ["carrefoursa", "carrefour", "carrefour sa"] },
  { brandKey: "macrocenter", displayName: "Macrocenter", domain: "macrocenter.com.tr", category: "grocery", aliases: ["macro center", "macrocenter"] },
  { brandKey: "metro", displayName: "Metro", domain: "metro-tr.com", category: "grocery", aliases: ["metro", "metro grosmarket"] },
  { brandKey: "hakmar", displayName: "Hakmar", domain: "hakmar.com.tr", category: "grocery", aliases: ["hakmar", "hakmar express"] },
  { brandKey: "file", displayName: "File", domain: "filemarket.com.tr", category: "grocery", aliases: ["file", "file market"] },
  { brandKey: "tarimkredi", displayName: "Tarım Kredi Kooperatif", domain: "tarimkredi.org.tr", category: "grocery", aliases: ["tarim kredi", "tarim kredi kooperatif"] },
  { brandKey: "happycenter", displayName: "Happy Center", domain: "happycenter.com.tr", category: "grocery", aliases: ["happy center", "happycenter"] },
  { brandKey: "onur", displayName: "Onur Market", domain: "onurmarket.com", category: "grocery", aliases: ["onur market", "onur"] },
  { brandKey: "ozdilek", displayName: "Özdilek", domain: "ozdilek.com.tr", category: "grocery", aliases: ["ozdilek", "ozdilek hipermarket"] },
  { brandKey: "kim", displayName: "Kim Market", domain: "kimmarket.com.tr", category: "grocery", aliases: ["kim market", "kim"] },
  { brandKey: "seyhanlar", displayName: "Seyhanlar Market", domain: "seyhanlarmarket.com.tr", category: "grocery", aliases: ["seyhanlar", "seyhanlar market"] },
  { brandKey: "groseri", displayName: "Groseri", domain: "groseri.com.tr", category: "grocery", aliases: ["groseri"] },
  { brandKey: "istegelsin", displayName: "İstegelsin", domain: "istegelsin.com", category: "grocery", aliases: ["istegelsin"] },
  { brandKey: "banabi", displayName: "Banabi", domain: "banabi.com", category: "grocery", aliases: ["banabi"] },
  { brandKey: "mopas", displayName: "Mopaş", domain: "mopas.com.tr", category: "grocery", aliases: ["mopas"] },
  { brandKey: "uyum", displayName: "Uyum Market", domain: "uyum.com.tr", category: "grocery", aliases: ["uyum", "uyum market"] },
  { brandKey: "bizimtoptan", displayName: "Bizim Toptan", domain: "bizimtoptan.com.tr", category: "grocery", aliases: ["bizim toptan", "bizim"] },
  { brandKey: "snowy", displayName: "Snowy", domain: "snowy.com.tr", category: "grocery", aliases: ["snowy"] },
  { brandKey: "pehlivanoglu", displayName: "Pehlivanoğlu", domain: "pehlivanoglu.com.tr", category: "grocery", aliases: ["pehlivanoglu"] },
  { brandKey: "starbucks", displayName: "Starbucks", domain: "starbucks.com.tr", category: "cafe", aliases: ["starbucks", "starbucks coffee"] },
  { brandKey: "kahvedunyasi", displayName: "Kahve Dünyası", domain: "kahvedunyasi.com", category: "cafe", aliases: ["kahve dunyasi"] },
  { brandKey: "caffenero", displayName: "Caffè Nero", domain: "caffenero.com", category: "cafe", aliases: ["caffe nero", "caffenero"] },
  { brandKey: "gloriajeans", displayName: "Gloria Jean's", domain: "gloriajeans.com.tr", category: "cafe", aliases: ["gloria jeans"] },
  { brandKey: "espressolab", displayName: "EspressoLab", domain: "espressolab.com", category: "cafe", aliases: ["espressolab", "espresso lab"] },
  { brandKey: "tchibo", displayName: "Tchibo", domain: "tchibo.com.tr", category: "cafe", aliases: ["tchibo"] },
  { brandKey: "mado", displayName: "Mado", domain: "mado.com.tr", category: "cafe", aliases: ["mado"] },
  { brandKey: "cafecrown", displayName: "Cafe Crown", domain: "cafecrown.com.tr", category: "cafe", aliases: ["cafe crown"] },
  { brandKey: "coffy", displayName: "Coffy", domain: "coffy.com.tr", category: "cafe", aliases: ["coffy"] },
  { brandKey: "juju", displayName: "Juju Coffee", domain: "jujucoffee.com", category: "cafe", aliases: ["juju", "juju coffee"] },
  { brandKey: "nero", displayName: "Nero", domain: "caffenero.com", category: "cafe", aliases: ["nero"] },
  { brandKey: "coffeelab", displayName: "Coffee Lab", domain: "coffeelab.com.tr", category: "cafe", aliases: ["coffee lab", "coffeelab"] },
  { brandKey: "simitsaray", displayName: "Simit Sarayı", domain: "simitsarayi.com", category: "cafe", aliases: ["simit sarayi", "simit sarayı"] },
  { brandKey: "pidem", displayName: "Pidem", domain: "pidem.com.tr", category: "cafe", aliases: ["pidem"] },
  { brandKey: "burgerking", displayName: "Burger King", domain: "burgerking.com.tr", category: "restaurant", aliases: ["burger king"] },
  { brandKey: "mcdonalds", displayName: "McDonald's", domain: "mcdonalds.com.tr", category: "restaurant", aliases: ["mcdonalds", "mc donalds"] },
  { brandKey: "popeyes", displayName: "Popeyes", domain: "popeyes.com.tr", category: "restaurant", aliases: ["popeyes"] },
  { brandKey: "dominos", displayName: "Domino's Pizza", domain: "dominos.com.tr", category: "restaurant", aliases: ["dominos", "dominos pizza"] },
  { brandKey: "kfc", displayName: "KFC", domain: "kfc.com.tr", category: "restaurant", aliases: ["kfc"] },
  { brandKey: "pizzahut", displayName: "Pizza Hut", domain: "pizzahut.com.tr", category: "restaurant", aliases: ["pizza hut", "pizzahut"] },
  { brandKey: "subway", displayName: "Subway", domain: "subway.com", category: "restaurant", aliases: ["subway"] },
  { brandKey: "littlecaesars", displayName: "Little Caesars", domain: "littlecaesars.com.tr", category: "restaurant", aliases: ["little caesars", "littlecaesars"] },
  { brandKey: "komagene", displayName: "Komagene", domain: "komagene.com.tr", category: "restaurant", aliases: ["komagene"] },
  { brandKey: "citir", displayName: "Çıtır Usta", domain: "citirusta.com", category: "restaurant", aliases: ["citir usta", "citir"] },
  { brandKey: "baydoner", displayName: "Baydöner", domain: "baydoner.com", category: "restaurant", aliases: ["baydoner"] },
  { brandKey: "kofteci", displayName: "Köfteci Yusuf", domain: "kofteciyusuf.com", category: "restaurant", aliases: ["kofteci yusuf", "kofteci"] },
  { brandKey: "tavukdunyasi", displayName: "Tavuk Dünyası", domain: "tavukdunyasi.com", category: "restaurant", aliases: ["tavuk dunyasi"] },
  { brandKey: "usta", displayName: "Usta Dönerci", domain: "ustadonerci.com", category: "restaurant", aliases: ["usta donerci"] },
  { brandKey: "midpoint", displayName: "Midpoint", domain: "midpoint.com.tr", category: "restaurant", aliases: ["midpoint"] },
  { brandKey: "bigchefs", displayName: "Big Chefs", domain: "bigchefs.com.tr", category: "restaurant", aliases: ["big chefs", "bigchefs"] },
  { brandKey: "nusret", displayName: "Nusr-Et", domain: "nusret.com.tr", category: "restaurant", aliases: ["nusret", "nusr et"] },
  { brandKey: "arbys", displayName: "Arby's", domain: "arbys.com", category: "restaurant", aliases: ["arbys"] },
  { brandKey: "sbarro", displayName: "Sbarro", domain: "sbarro.com", category: "restaurant", aliases: ["sbarro"] },
  { brandKey: "ham", displayName: "HAM Burger", domain: "hamburger.com.tr", category: "restaurant", aliases: ["ham burger"] },
  { brandKey: "burgerlab", displayName: "Burger Lab", domain: "burgerlab.com.tr", category: "restaurant", aliases: ["burger lab", "burgerlab"] },
  { brandKey: "kahveci", displayName: "Kahveci", domain: "kahveci.com.tr", category: "restaurant", aliases: ["kahveci"] },
  { brandKey: "shell", displayName: "Shell", domain: "shell.com.tr", category: "fuel", aliases: ["shell", "shell turcas"] },
  { brandKey: "opet", displayName: "Opet", domain: "opet.com.tr", category: "fuel", aliases: ["opet"] },
  { brandKey: "bp", displayName: "BP", domain: "bp.com", category: "fuel", aliases: ["bp", "bp petrol"] },
  { brandKey: "petrolofisi", displayName: "Petrol Ofisi", domain: "petrolofisi.com.tr", category: "fuel", aliases: ["petrol ofisi", "po petrol"] },
  { brandKey: "total", displayName: "TotalEnergies", domain: "total.com.tr", category: "fuel", aliases: ["total", "totalenergies"] },
  { brandKey: "aytemiz", displayName: "Aytemiz", domain: "aytemiz.com.tr", category: "fuel", aliases: ["aytemiz"] },
  { brandKey: "lukoil", displayName: "Lukoil", domain: "lukoil.com.tr", category: "fuel", aliases: ["lukoil"] },
  { brandKey: "alpet", displayName: "Alpet", domain: "alpet.com.tr", category: "fuel", aliases: ["alpet"] },
  { brandKey: "moil", displayName: "Moil", domain: "moil.com.tr", category: "fuel", aliases: ["moil"] },
  { brandKey: "turkpetrol", displayName: "Türk Petrol", domain: "turkpetrol.com.tr", category: "fuel", aliases: ["turk petrol"] },
  { brandKey: "trendyol", displayName: "Trendyol", domain: "trendyol.com", category: "marketplace", aliases: ["trendyol", "trendyol express", "dolap"] },
  { brandKey: "hepsiburada", displayName: "Hepsiburada", domain: "hepsiburada.com", category: "marketplace", aliases: ["hepsiburada"] },
  { brandKey: "amazon", displayName: "Amazon", domain: "amazon.com.tr", category: "marketplace", aliases: ["amazon", "amazon turkiye"] },
  { brandKey: "n11", displayName: "n11", domain: "n11.com", category: "marketplace", aliases: ["n11"] },
  { brandKey: "getir", displayName: "Getir", domain: "getir.com", category: "marketplace", aliases: ["getir", "getir buyuk"] },
  { brandKey: "yemeksepeti", displayName: "Yemeksepeti", domain: "yemeksepeti.com", category: "marketplace", aliases: ["yemeksepeti"] },
  { brandKey: "ciceksepeti", displayName: "Çiçeksepeti", domain: "ciceksepeti.com", category: "marketplace", aliases: ["ciceksepeti"] },
  { brandKey: "migrosonline", displayName: "Migros Sanal Market", domain: "migros.com.tr", category: "marketplace", aliases: ["migros sanal market", "migros online"] },
  { brandKey: "gittigidiyor", displayName: "GittiGidiyor", domain: "gittigidiyor.com", category: "marketplace", aliases: ["gittigidiyor"] },
  { brandKey: "pttavm", displayName: "PTT AVM", domain: "pttavm.com", category: "marketplace", aliases: ["ptt avm", "pttavm"] },
  { brandKey: "morhipo", displayName: "Morhipo", domain: "morhipo.com", category: "marketplace", aliases: ["morhipo"] },
  { brandKey: "modanisa", displayName: "Modanisa", domain: "modanisa.com", category: "marketplace", aliases: ["modanisa"] },
  { brandKey: "trendyolyemek", displayName: "Trendyol Yemek", domain: "trendyol.com", category: "marketplace", aliases: ["trendyol yemek"] },
  { brandKey: "getiryemek", displayName: "Getir Yemek", domain: "getir.com", category: "marketplace", aliases: ["getir yemek"] },
  { brandKey: "watsons", displayName: "Watsons", domain: "watsons.com.tr", category: "pharmacy", aliases: ["watsons"] },
  { brandKey: "gratis", displayName: "Gratis", domain: "gratis.com", category: "pharmacy", aliases: ["gratis"] },
  { brandKey: "rossmann", displayName: "Rossmann", domain: "rossmann.com.tr", category: "pharmacy", aliases: ["rossmann"] },
  { brandKey: "sephora", displayName: "Sephora", domain: "sephora.com.tr", category: "pharmacy", aliases: ["sephora"] },
  { brandKey: "flormar", displayName: "Flormar", domain: "flormar.com.tr", category: "pharmacy", aliases: ["flormar"] },
  { brandKey: "thebodyshop", displayName: "The Body Shop", domain: "thebodyshop.com.tr", category: "pharmacy", aliases: ["body shop", "the body shop"] },
  { brandKey: "yvesrocher", displayName: "Yves Rocher", domain: "yves-rocher.com.tr", category: "pharmacy", aliases: ["yves rocher"] },
  { brandKey: "eczane", displayName: "Eczane", domain: "", category: "pharmacy", aliases: [] },
  { brandKey: "mediamarkt", displayName: "MediaMarkt", domain: "mediamarkt.com.tr", category: "electronics", aliases: ["media markt", "mediamarkt"] },
  { brandKey: "teknosa", displayName: "Teknosa", domain: "teknosa.com", category: "electronics", aliases: ["teknosa"] },
  { brandKey: "vatan", displayName: "Vatan Bilgisayar", domain: "vatanbilgisayar.com", category: "electronics", aliases: ["vatan bilgisayar", "vatan"] },
  { brandKey: "apple", displayName: "Apple", domain: "apple.com", category: "electronics", aliases: ["apple", "apple store"] },
  { brandKey: "samsung", displayName: "Samsung", domain: "samsung.com", category: "electronics", aliases: ["samsung"] },
  { brandKey: "itopya", displayName: "İtopya", domain: "itopya.com", category: "electronics", aliases: ["itopya"] },
  { brandKey: "incehesap", displayName: "İncehesap", domain: "incehesap.com", category: "electronics", aliases: ["incehesap"] },
  { brandKey: "goldbilgisayar", displayName: "Gold Bilgisayar", domain: "goldbilgisayar.com.tr", category: "electronics", aliases: ["gold bilgisayar"] },
  { brandKey: "dyson", displayName: "Dyson", domain: "dyson.com.tr", category: "electronics", aliases: ["dyson"] },
  { brandKey: "arcelik", displayName: "Arçelik", domain: "arcelik.com.tr", category: "electronics", aliases: ["arcelik"] },
  { brandKey: "vestel", displayName: "Vestel", domain: "vestel.com.tr", category: "electronics", aliases: ["vestel"] },
  { brandKey: "beko", displayName: "Beko", domain: "beko.com.tr", category: "electronics", aliases: ["beko"] },
  { brandKey: "lcwaikiki", displayName: "LC Waikiki", domain: "lcwaikiki.com", category: "apparel", aliases: ["lc waikiki", "lcw"] },
  { brandKey: "defacto", displayName: "DeFacto", domain: "defacto.com.tr", category: "apparel", aliases: ["defacto"] },
  { brandKey: "koton", displayName: "Koton", domain: "koton.com", category: "apparel", aliases: ["koton"] },
  { brandKey: "mavi", displayName: "Mavi", domain: "mavi.com", category: "apparel", aliases: ["mavi", "mavi jeans"] },
  { brandKey: "boyner", displayName: "Boyner", domain: "boyner.com.tr", category: "apparel", aliases: ["boyner"] },
  { brandKey: "zara", displayName: "Zara", domain: "zara.com", category: "apparel", aliases: ["zara"] },
  { brandKey: "hm", displayName: "H&M", domain: "hm.com", category: "apparel", aliases: ["h m", "hennes mauritz"] },
  { brandKey: "bershka", displayName: "Bershka", domain: "bershka.com", category: "apparel", aliases: ["bershka"] },
  { brandKey: "pullbear", displayName: "Pull&Bear", domain: "pullandbear.com", category: "apparel", aliases: ["pull bear", "pull and bear"] },
  { brandKey: "stradivarius", displayName: "Stradivarius", domain: "stradivarius.com", category: "apparel", aliases: ["stradivarius"] },
  { brandKey: "mango", displayName: "Mango", domain: "mango.com", category: "apparel", aliases: ["mango"] },
  { brandKey: "colins", displayName: "Colin's", domain: "colins.com.tr", category: "apparel", aliases: ["colins"] },
  { brandKey: "kigili", displayName: "Kiğılı", domain: "kigili.com", category: "apparel", aliases: ["kigili"] },
  { brandKey: "damat", displayName: "Damat Tween", domain: "damattween.com", category: "apparel", aliases: ["damat", "damat tween"] },
  { brandKey: "network", displayName: "Network", domain: "network.com.tr", category: "apparel", aliases: ["network"] },
  { brandKey: "ipekyol", displayName: "İpekyol", domain: "ipekyol.com.tr", category: "apparel", aliases: ["ipekyol"] },
  { brandKey: "twist", displayName: "Twist", domain: "twist.com.tr", category: "apparel", aliases: ["twist"] },
  { brandKey: "flo", displayName: "FLO", domain: "flo.com.tr", category: "apparel", aliases: ["flo"] },
  { brandKey: "deichmann", displayName: "Deichmann", domain: "deichmann.com", category: "apparel", aliases: ["deichmann"] },
  { brandKey: "ayakkabidunyasi", displayName: "Ayakkabı Dünyası", domain: "ayakkabidunyasi.com.tr", category: "apparel", aliases: ["ayakkabi dunyasi"] },
  { brandKey: "derimod", displayName: "Derimod", domain: "derimod.com.tr", category: "apparel", aliases: ["derimod"] },
  { brandKey: "hotic", displayName: "Hotiç", domain: "hotic.com.tr", category: "apparel", aliases: ["hotic"] },
  { brandKey: "ramsey", displayName: "Ramsey", domain: "ramsey.com.tr", category: "apparel", aliases: ["ramsey"] },
  { brandKey: "uspolo", displayName: "U.S. Polo Assn.", domain: "uspoloassn.com.tr", category: "apparel", aliases: ["us polo", "polo assn"] },
  { brandKey: "lacoste", displayName: "Lacoste", domain: "lacoste.com.tr", category: "apparel", aliases: ["lacoste"] },
  { brandKey: "nike", displayName: "Nike", domain: "nike.com", category: "apparel", aliases: ["nike"] },
  { brandKey: "adidas", displayName: "Adidas", domain: "adidas.com.tr", category: "apparel", aliases: ["adidas"] },
  { brandKey: "puma", displayName: "Puma", domain: "tr.puma.com", category: "apparel", aliases: ["puma"] },
  { brandKey: "decathlon", displayName: "Decathlon", domain: "decathlon.com.tr", category: "sports", aliases: ["decathlon"] },
  { brandKey: "intersport", displayName: "Intersport", domain: "intersport.com.tr", category: "sports", aliases: ["intersport"] },
  { brandKey: "sportive", displayName: "Sportive", domain: "sportive.com.tr", category: "sports", aliases: ["sportive"] },
  { brandKey: "ikea", displayName: "IKEA", domain: "ikea.com.tr", category: "home", aliases: ["ikea"] },
  { brandKey: "koctas", displayName: "Koçtaş", domain: "koctas.com.tr", category: "home", aliases: ["koctas"] },
  { brandKey: "bauhaus", displayName: "Bauhaus", domain: "bauhaus.com.tr", category: "home", aliases: ["bauhaus"] },
  { brandKey: "englishhome", displayName: "English Home", domain: "englishhome.com", category: "home", aliases: ["english home"] },
  { brandKey: "madamecoco", displayName: "Madame Coco", domain: "madamecoco.com", category: "home", aliases: ["madame coco"] },
  { brandKey: "karaca", displayName: "Karaca", domain: "karaca.com", category: "home", aliases: ["karaca"] },
  { brandKey: "pasabahce", displayName: "Paşabahçe", domain: "pasabahce.com", category: "home", aliases: ["pasabahce"] },
  { brandKey: "tekzen", displayName: "Tekzen", domain: "tekzen.com.tr", category: "home", aliases: ["tekzen"] },
  { brandKey: "evidea", displayName: "Evidea", domain: "evidea.com", category: "home", aliases: ["evidea"] },
  { brandKey: "mudo", displayName: "Mudo", domain: "mudo.com.tr", category: "home", aliases: ["mudo"] },
  { brandKey: "chakra", displayName: "Chakra", domain: "chakra.com.tr", category: "home", aliases: ["chakra"] },
  { brandKey: "linens", displayName: "Linens", domain: "linens.com.tr", category: "home", aliases: ["linens"] },
  { brandKey: "yatas", displayName: "Yataş", domain: "yatas.com.tr", category: "home", aliases: ["yatas"] },
  { brandKey: "istikbal", displayName: "İstikbal", domain: "istikbal.com.tr", category: "home", aliases: ["istikbal"] },
  { brandKey: "bellona", displayName: "Bellona", domain: "bellona.com.tr", category: "home", aliases: ["bellona"] },
  { brandKey: "dogtas", displayName: "Doğtaş", domain: "dogtas.com", category: "home", aliases: ["dogtas"] },
  { brandKey: "mondi", displayName: "Mondi", domain: "mondi.com.tr", category: "home", aliases: ["mondi"] },
  { brandKey: "toyzz", displayName: "Toyzz Shop", domain: "toyzzshop.com", category: "kids", aliases: ["toyzz shop", "toyzz"] },
  { brandKey: "ebebek", displayName: "ebebek", domain: "ebebek.com", category: "kids", aliases: ["ebebek"] },
  { brandKey: "joker", displayName: "Joker", domain: "joker.com.tr", category: "kids", aliases: ["joker"] },
  { brandKey: "lcwaikikikids", displayName: "LCW Kids", domain: "lcwaikiki.com", category: "kids", aliases: ["lcw kids"] },
  { brandKey: "dr", displayName: "D&R", domain: "dr.com.tr", category: "books", aliases: ["d r", "dr kitap"] },
  { brandKey: "kitapyurdu", displayName: "Kitapyurdu", domain: "kitapyurdu.com", category: "books", aliases: ["kitapyurdu"] },
  { brandKey: "idefix", displayName: "idefix", domain: "idefix.com", category: "books", aliases: ["idefix"] },
  { brandKey: "remzi", displayName: "Remzi Kitabevi", domain: "remzi.com.tr", category: "books", aliases: ["remzi", "remzi kitabevi"] },
  { brandKey: "nezih", displayName: "Nezih", domain: "nezih.com.tr", category: "books", aliases: ["nezih"] },
  { brandKey: "turkcell", displayName: "Turkcell", domain: "turkcell.com.tr", category: "other", aliases: ["turkcell"] },
  { brandKey: "vodafone", displayName: "Vodafone", domain: "vodafone.com.tr", category: "other", aliases: ["vodafone"] },
  { brandKey: "turktelekom", displayName: "Türk Telekom", domain: "turktelekom.com.tr", category: "other", aliases: ["turk telekom", "ttnet"] },
  { brandKey: "ziraat", displayName: "Ziraat Bankası", domain: "ziraatbank.com.tr", category: "other", aliases: ["ziraat", "ziraat bankasi"] },
  { brandKey: "isbank", displayName: "İş Bankası", domain: "isbank.com.tr", category: "other", aliases: ["is bankasi", "isbank"] },
  { brandKey: "garanti", displayName: "Garanti BBVA", domain: "garantibbva.com.tr", category: "other", aliases: ["garanti", "garanti bbva"] },
  { brandKey: "akbank", displayName: "Akbank", domain: "akbank.com", category: "other", aliases: ["akbank"] },
  { brandKey: "yapikredi", displayName: "Yapı Kredi", domain: "yapikredi.com.tr", category: "other", aliases: ["yapi kredi", "yapikredi"] },
  { brandKey: "enpara", displayName: "Enpara", domain: "enpara.com", category: "other", aliases: ["enpara"] },
  { brandKey: "papara", displayName: "Papara", domain: "papara.com", category: "other", aliases: ["papara"] },
  { brandKey: "ininal", displayName: "ininal", domain: "ininal.com", category: "other", aliases: ["ininal"] },
  { brandKey: "thy", displayName: "Türk Hava Yolları", domain: "turkishairlines.com", category: "other", aliases: ["turk hava yollari", "thy", "turkish airlines"] },
  { brandKey: "pegasus", displayName: "Pegasus", domain: "flypgs.com", category: "other", aliases: ["pegasus"] },
  { brandKey: "sunexpress", displayName: "SunExpress", domain: "sunexpress.com", category: "other", aliases: ["sunexpress"] },
];
