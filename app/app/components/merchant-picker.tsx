"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";
import type { Merchant } from "@/lib/receipt/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface MerchantPickerProps {
  merchant: Merchant;
  onSelect: (merchant: Merchant) => void;
}

export function MerchantPicker({ merchant, onSelect }: MerchantPickerProps) {
  const { locale } = useAppLocale();
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const [query, setQuery] = useState(merchant.name || "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/places-app/autocomplete?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to fetch places:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchPlaces]);

  const handleSelectPlace = async (placeId: string, description: string) => {
    try {
      const response = await fetch(
        `/api/places-app/details?placeId=${encodeURIComponent(placeId)}`
      );
      const data = await response.json();
      
      onSelect({
        name: data.name || description,
        placeId: data.placeId,
        category: data.category,
        country: data.country,
      });
      
      setQuery(data.name || description);
      setSuggestions([]);
    } catch (error) {
      console.error("Failed to fetch place details:", error);
    }
  };

  const handleManualEntry = () => {
    onSelect({
      name: query,
      category: undefined,
      country: undefined,
    });
    setSuggestions([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{byLocale("İşletme Bilgisi", "Merchant Information", "Информация о магазине", "ข้อมูลร้านค้า", "Información del comercio", "商家信息")}</CardTitle>
        <CardDescription>
          {byLocale("İşletmeyi arayın veya manuel girin", "Search for the merchant or enter manually", "Найдите магазин или введите вручную", "ค้นหาร้านค้าหรือกรอกเอง", "Busca el comercio o ingrésalo manualmente", "搜索商家或手动输入")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="merchant-search">{byLocale("İşletme Adı", "Merchant Name", "Название магазина", "ชื่อร้านค้า", "Nombre del comercio", "商家名称")}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="merchant-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={byLocale("İşletme ara...", "Search for merchant...", "Поиск магазина...", "ค้นหาร้านค้า...", "Buscar comercio...", "搜索商家...")}
              className="pl-10"
            />
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSelectPlace(suggestion.place_id, suggestion.description)}
                className="w-full text-left p-2 hover:bg-muted rounded flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{suggestion.description}</span>
              </button>
            ))}
          </div>
        )}

        {query && suggestions.length === 0 && !isLoading && (
          <Button variant="outline" onClick={handleManualEntry} className="w-full">
            {byLocale(
              `"${query}" adını işletme olarak kullan`,
              `Use "${query}" as merchant name`,
              `Использовать "${query}" как название магазина`,
              `ใช้ "${query}" เป็นชื่อร้านค้า`,
              `Usar "${query}" como nombre del comercio`,
              `将 "${query}" 用作商家名称`,
            )}
          </Button>
        )}

        {merchant.name && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{byLocale("Seçilen:", "Selected:", "Выбрано:", "ที่เลือก:", "Seleccionado:", "已选择：")}</span>
              <span>{merchant.name}</span>
            </div>
            {merchant.category && (
              <Badge variant="secondary">{merchant.category}</Badge>
            )}
            {merchant.country && (
              <Badge variant="outline">{merchant.country}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}






