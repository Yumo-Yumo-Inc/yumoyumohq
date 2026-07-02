"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Users, 
  FileCheck, 
  TrendingUp, 
  Truck, 
  Calculator,
  MapPin,
  CheckCircle2
} from "lucide-react";

interface AnalysisStep {
  id: string;
  labels: Record<string, string>;
  descs: Record<string, string>;
  icon: React.ReactNode;
  progress: number;
}

interface DeepScanAnalyzerProps {
  isActive: boolean;
  onComplete?: () => void;
  estimatedDuration?: number;
  actualProgress?: number;
  locale?: string;
}

const analysisSteps: AnalysisStep[] = [
  { 
    id: "location",
    labels: { tr: "İşletme yeri tespit ediliyor", en: "Detecting business location", ru: "Определяем локацию бизнеса", th: "กำลังระบุตำแหน่งธุรกิจ", es: "Detectando ubicación del negocio", zh: "正在识别商家位置" },
    descs: { tr: "Coğrafi konum analiz ediliyor", en: "Analyzing geographic location", ru: "Анализируем географическое положение", th: "กำลังวิเคราะห์ตำแหน่งทางภูมิศาสตร์", es: "Analizando ubicación geográfica", zh: "正在分析地理位置" },
    icon: <MapPin className="w-4 h-4" />,
    progress: 12,
  },
  { 
    id: "rent",
    labels: { tr: "Kira maliyetleri hesaplanıyor", en: "Calculating rent costs", ru: "Считаем затраты на аренду", th: "กำลังคำนวณค่าเช่า", es: "Calculando costos de alquiler", zh: "正在计算租金成本" },
    descs: { tr: "Bölgesel kira endeksleri karşılaştırılıyor", en: "Comparing regional rent indices", ru: "Сравниваем региональные индексы аренды", th: "กำลังเปรียบเทียบดัชนีค่าเช่าตามภูมิภาค", es: "Comparando índices regionales de alquiler", zh: "正在比较区域租金指数" },
    icon: <Building2 className="w-4 h-4" />,
    progress: 25,
  },
  { 
    id: "employees",
    labels: { tr: "Çalışan masrafları analiz ediliyor", en: "Analyzing employee costs", ru: "Анализируем расходы на персонал", th: "กำลังวิเคราะห์ค่าใช้จ่ายพนักงาน", es: "Analizando costos de personal", zh: "正在分析员工成本" },
    descs: { tr: "Personel giderleri hesaplanıyor", en: "Calculating personnel expenses", ru: "Считаем расходы на персонал", th: "กำลังคำนวณค่าใช้จ่ายบุคลากร", es: "Calculando gastos de personal", zh: "正在计算人力成本" },
    icon: <Users className="w-4 h-4" />,
    progress: 40,
  },
  { 
    id: "supply",
    labels: { tr: "Tedarik zincirleri taranıyor", en: "Scanning supply chains", ru: "Сканируем цепочки поставок", th: "กำลังสแกนห่วงโซ่อุปทาน", es: "Escaneando cadenas de suministro", zh: "正在扫描供应链" },
    descs: { tr: "Lojistik maliyetler analiz ediliyor", en: "Analyzing logistics costs", ru: "Анализируем логистические затраты", th: "กำลังวิเคราะห์ต้นทุนโลจิสติกส์", es: "Analizando costos logísticos", zh: "正在分析物流成本" },
    icon: <Truck className="w-4 h-4" />,
    progress: 55,
  },
  { 
    id: "taxes",
    labels: { tr: "Görünmeyen vergiler çıkartılıyor", en: "Extracting hidden taxes", ru: "Выявляем скрытые налоги", th: "กำลังแยกภาษีแฝง", es: "Extrayendo impuestos ocultos", zh: "正在提取隐性税费" },
    descs: { tr: "KDV ve dolaylı vergiler hesaplanıyor", en: "Calculating VAT and indirect taxes", ru: "Считаем НДС и косвенные налоги", th: "กำลังคำนวณ VAT และภาษีทางอ้อม", es: "Calculando IVA e impuestos indirectos", zh: "正在计算增值税与间接税" },
    icon: <Calculator className="w-4 h-4" />,
    progress: 70,
  },
  { 
    id: "margins",
    labels: { tr: "Kar marjları hesaplanıyor", en: "Calculating profit margins", ru: "Считаем маржу прибыли", th: "กำลังคำนวณกำไรขั้นต้น", es: "Calculando márgenes de ganancia", zh: "正在计算利润率" },
    descs: { tr: "Perakende fiyat farklılıkları", en: "Retail price differences", ru: "Разница в розничных ценах", th: "ความต่างของราคาขายปลีก", es: "Diferencias de precios minoristas", zh: "零售价格差异" },
    icon: <TrendingUp className="w-4 h-4" />,
    progress: 85,
  },
  { 
    id: "finalize",
    labels: { tr: "Rapor oluşturuluyor", en: "Generating report", ru: "Формируем отчет", th: "กำลังสร้างรายงาน", es: "Generando informe", zh: "正在生成报告" },
    descs: { tr: "Gizli maliyet raporu hazırlanıyor", en: "Preparing hidden cost report", ru: "Готовим отчет по скрытым расходам", th: "กำลังจัดทำรายงานต้นทุนแฝง", es: "Preparando informe de costos ocultos", zh: "正在准备隐性成本报告" },
    icon: <FileCheck className="w-4 h-4" />,
    progress: 100,
  }
];

export function DeepScanAnalyzer({
  isActive,
  onComplete,
  estimatedDuration = 23000,
  actualProgress,
  locale = "en"
}: DeepScanAnalyzerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const startTimeRef = useRef<number | null>(null);

  // Track completed steps with ref to avoid re-renders causing infinite loop
  const completedStepsRef = useRef<Set<string>>(new Set());
  const onCompleteRef = useRef(onComplete);
  
  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Main progress loop - only depends on isActive, actualProgress, estimatedDuration
  useEffect(() => {
    if (!isActive) {
      startTimeRef.current = null;
      completedStepsRef.current = new Set();
      setProgress(0);
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (actualProgress !== undefined && actualProgress >= 100) {
        setProgress(100);
        setCurrentStepIndex(analysisSteps.length - 1);
        setCompletedSteps(analysisSteps.map(s => s.id));
        clearInterval(interval);
        setTimeout(() => onCompleteRef.current?.(), 1000);
        return;
      }

      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const timeBasedProgress = Math.min((elapsed / estimatedDuration) * 85, 85);
      
      const effectiveProgress = actualProgress !== undefined && actualProgress > 85 
        ? actualProgress 
        : timeBasedProgress;

      setProgress(effectiveProgress);

      // Find current step and update completed steps
      let newStepIndex = 0;
      const newCompletedSteps: string[] = [];
      
      for (let i = 0; i < analysisSteps.length; i++) {
        if (effectiveProgress >= analysisSteps[i].progress) {
          newStepIndex = i;
          newCompletedSteps.push(analysisSteps[i].id);
        } else {
          break;
        }
      }

      // Only update state if there are actual changes
      setCurrentStepIndex(prev => prev !== newStepIndex ? newStepIndex : prev);
      
      // Check if completed steps changed using the ref
      const hasNewSteps = newCompletedSteps.some(id => !completedStepsRef.current.has(id));
      if (hasNewSteps) {
        newCompletedSteps.forEach(id => completedStepsRef.current.add(id));
        setCompletedSteps([...completedStepsRef.current]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, actualProgress, estimatedDuration]);

  if (!isActive) return null;

  const currentStep = analysisSteps[currentStepIndex];
  const label = currentStep.labels[locale] || currentStep.labels.en;
  const desc = currentStep.descs[locale] || currentStep.descs.en;

  const texts = {
    tr: { title: "Fiş Analiz Ediliyor", subtitle: "Gizli maliyetler tespit ediliyor..." },
    en: { title: "Analyzing Receipt", subtitle: "Detecting hidden costs..." },
    ru: { title: "Анализируем чек", subtitle: "Выявляем скрытые расходы..." },
    th: { title: "กำลังวิเคราะห์ใบเสร็จ", subtitle: "กำลังตรวจจับต้นทุนแฝง..." },
    es: { title: "Analizando recibo", subtitle: "Detectando costos ocultos..." },
    zh: { title: "正在分析小票", subtitle: "正在识别隐性成本..." },
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return (
    <div className="space-y-4">
      <Card className="card-cinematic">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">{t.title}</h2>
            <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          </div>

          {/* Current Step */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-lg bg-primary/20 text-primary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {currentStep.icon}
              </motion.div>
              <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {analysisSteps.slice(0, -1).map((step, idx) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-xs transition-all",
                    isCompleted && "bg-primary/10 text-primary",
                    isCurrent && !isCompleted && "bg-muted text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.icon}
                  <span className="truncate">
                    {(step.labels[locale] || step.labels.en).split(" ")[0]}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
