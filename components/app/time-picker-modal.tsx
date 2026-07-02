"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimePickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void; // time in HH:MM format
  locale?: string;
}

export function TimePickerModal({
  open,
  onClose,
  onConfirm,
  locale = "en",
}: TimePickerModalProps) {
  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    String(i).padStart(2, '0')
  );
  
  // Generate minute options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => 
    String(i).padStart(2, '0')
  );

  // Initialize with current time or 12:00
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0');
  });
  
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    const now = new Date();
    return String(now.getMinutes()).padStart(2, '0');
  });

  const texts = {
    tr: {
      title: "Zaman Seçin",
      description: "Fiş üzerinde zaman tespit edilemedi. Lütfen işlem zamanını seçin.",
      hour: "Saat",
      minute: "Dakika",
      confirm: "Onayla",
      cancel: "İptal",
    },
    en: {
      title: "Select Time",
      description: "Time could not be detected on the receipt. Please select the transaction time.",
      hour: "Hour",
      minute: "Minute",
      confirm: "Confirm",
      cancel: "Cancel",
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  const handleConfirm = () => {
    const time = `${selectedHour}:${selectedMinute}`;
    onConfirm(time);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <DialogTitle>{t.title}</DialogTitle>
          </div>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-4 justify-center">
            {/* Hour Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t.hour}
              </label>
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={t.hour} />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separator */}
            <div className="pt-8">
              <span className="text-2xl font-bold">:</span>
            </div>

            {/* Minute Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t.minute}
              </label>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={t.minute} />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={handleConfirm}>
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
