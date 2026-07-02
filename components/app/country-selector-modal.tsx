"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEnabledCountries } from "@/lib/shared/countries";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { toast } from "sonner";

const countries = getEnabledCountries();

interface CountrySelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCountry?: string | null;
  onSaved?: (country: string) => void | Promise<void>;
}

export function CountrySelectorModal({
  open,
  onOpenChange,
  initialCountry,
  onSaved,
}: CountrySelectorModalProps) {
  const { t } = useAppLocale();
  const { refresh } = useAppProfile();
  const [country, setCountry] = useState(initialCountry || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCountry(initialCountry || "");
    }
  }, [initialCountry, open]);

  const handleSave = async () => {
    if (!country) {
      toast.error(t("errors.api.selectCountryFirst"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to save user country");
      }

      await refresh();
      await onSaved?.(country);
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? translateApiError(error.message, t) || error.message
          : t("errors.api.unknown");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("auth.register.country")}</DialogTitle>
          <DialogDescription>
            {t("errors.login.selectCountryFirst")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="country-required-select">{t("auth.register.country")}</Label>
          <Select value={country} onValueChange={setCountry} disabled={isSaving}>
            <SelectTrigger id="country-required-select">
              <SelectValue placeholder={t("auth.register.countryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.saving")}
              </>
            ) : (
              t("settings.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
