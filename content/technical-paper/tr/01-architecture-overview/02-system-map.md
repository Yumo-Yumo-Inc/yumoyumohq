# Yüksek seviyeli sistem haritası

## 1.1 Yüksek seviyeli sistem haritası

```mermaid
flowchart LR
    subgraph Client["Kullanıcı cihazı"]
        A["Uygulama<br/>cüzdan imzası + fiş yakalama"]
    end

    subgraph Processing["Eşzamanlı işleme"]
        B["API yüzeyi"]
        C["Fiş işleme boru hattı"]
        D["Güven katmanı"]
    end

    subgraph Data["Zincir dışı veri"]
        E[("Fiş kayıtları")]
        F[("bINT / ePoints defteri")]
        G["Anonim toplamlar"]
    end

    subgraph Chain["Zincir üstü katman"]
        H["Token programları"]
        I["Hazine ve staking"]
        J["Kriptografik taahhütler"]
    end

    A --> B --> C --> D
    D --> E
    D --> F
    E --> G
    F -. "gruplu mutabakat" .-> H
    F -. "taahhüt" .-> J
    H --> I
```

Harita açık mimari sınırını gösterir: kullanıcıya dönen önizleme eşzamanlıdır; bINT ve ePoints muhasebesi deftere yazıldıktan sonra mutabakat işçileri tarafından zincir üstü katmana taşınır. Diyagram, protokol bileşenlerini ve veri hareketini gösterir.
