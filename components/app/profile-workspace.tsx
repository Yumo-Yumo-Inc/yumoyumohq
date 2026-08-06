"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Camera, ChevronRight, Coins, Flame, Globe2, Gift, Heart, KeyRound, Link2, Loader2, Lock, LogOut, Mail, MapPin, MessageSquareText, Palette, Save, Shield, Trash2, UserRound, Users, Volume2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AvatarImage } from "@/components/app/avatar-image";
import { APP_LOCALES } from "@/components/app/app-locale-dropdown";
import { IncomeBandSelect } from "@/components/app/income-band-select";
import { ThemeCard } from "@/components/app/theme-card";
import { ProfileRecentReceipts } from "@/components/app/profile-recent-receipts";
import { ReferralShareCard } from "@/components/app/referral-share-card";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { WalletAddressLink } from "@/components/wallet-address-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_LEVEL_XP_THRESHOLDS } from "@/config/account-level-config";
import { availableNameColors, isNameColorUnlocked, resolveNameColorHex } from "@/config/name-colors";
import { PROFILE_FRAMES, availableProfileFrames, isProfileFrameUnlocked } from "@/config/profile-frames";
import { availableThemeAccents, isThemeAccentUnlocked, resolveThemeAccentHex } from "@/config/theme-accents";
import { availableProfileBackgrounds, isProfileBgUnlocked } from "@/config/profile-backgrounds";
import { availableAvatarStickers, isAvatarStickerUnlocked } from "@/config/avatar-stickers";
import { availableSeals, isSealUnlocked } from "@/config/proof-seals";
import { RewardArt, rewardArtFor } from "@/components/app/season/reward-art";
import { AvatarFrame } from "@/components/app/avatar-frame";
import { useAppProfile } from "@/lib/app/profile-context";
import { useTheme } from "@/lib/theme/theme-context";
import { useSound } from "@/lib/audio/sound-context";
import { useAppLocale, translateApiError, type AppLocale } from "@/lib/i18n/app-context";
import { openCookiePreferences } from "@/lib/legal/cookie-consent";
import { patchCachedProfileAvatar, patchCachedProfileFields } from "@/lib/offline/cache";
import { clearAuthenticatedSessionCache } from "@/lib/auth/session-cache";
import { getCountryByCode, normalizeCountryCode, isOtherCountry } from "@/lib/shared/countries";
import { formatDateOnly } from "@/lib/shared/date-only";
import { getStreakBarFilledCount } from "@/lib/streak/streak-math";
import { syncMobileData } from "@/lib/sync";

interface ProfileWorkspaceProps {
  variant?: "page" | "modal";
  onDone?: () => void;
}

function WalletPanel({ locale }: { locale: string }) {
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {l("Cüzdan", "Wallet", "Кошелек", "กระเป๋าเงิน", "Billetera", "钱包")}
        </h3>
      </div>
      <p className="text-sm leading-6" style={{ color: "var(--app-text-secondary)" }}>
        {l(
          "Solana cüzdanını bağlayarak zincir üstü işlemler açıldığında kullanmaya hazır ol.",
          "Connect your Solana wallet to use on-chain actions when they become available.",
          "Подключи Solana-кошелек, чтобы быть готовым к on-chain действиям, когда они появятся.",
          "เชื่อมต่อกระเป๋า Solana เพื่อพร้อมใช้งานฟีเจอร์ on-chain เมื่อเปิดให้ใช้",
          "Conecta tu billetera de Solana para usar acciones on-chain cuando estén disponibles.",
          "连接 Solana 钱包，以便在链上功能开放时立即使用。",
        )}
      </p>
      <WalletConnectButton />
      <WalletAddressLink locale={locale} />
    </div>
  );
}

export function ProfileWorkspace({ variant = "page", onDone }: ProfileWorkspaceProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useAppLocale();
  const { prefs: soundPrefs, setEnabled: setSoundEnabled, setVolume: setSoundVolume } = useSound();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const numLocale = locale === "ru" ? "ru-RU" : locale === "th" ? "th-TH" : locale === "es" ? "es-ES" : locale === "zh" ? "zh-CN" : locale === "tr" ? "tr-TR" : "en-US";
  const { profile, refresh } = useAppProfile();
  const { theme } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [incomeBand, setIncomeBand] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [nameColor, setNameColor] = useState<string | null>(null);
  const [profileFrame, setProfileFrame] = useState<string | null>(null);
  const [themeAccent, setThemeAccent] = useState<string | null>(null);
  const [profileBg, setProfileBg] = useState<string | null>(null);
  const [avatarSticker, setAvatarSticker] = useState<string | null>(null);
  const [seal, setSeal] = useState<string | null>(null);
  const [cosmeticGrants, setCosmeticGrants] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [accountEmail, setAccountEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailLoading, setEmailLoading] = useState(true);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [openUtilityPanel, setOpenUtilityPanel] = useState<"wallet" | "referrals" | "security" | null>(null);
  const [companionLocale, setCompanionLocale] = useState<AppLocale>(locale);
  const [companionLocaleLoading, setCompanionLocaleLoading] = useState(true);

  const normalizeEmailCompare = (value: string) => value.trim().toLowerCase();
  const emailHasUnsavedChanges =
    normalizeEmailCompare(emailInput) !== normalizeEmailCompare(accountEmail);

  const resendVerificationEmail = async () => {
    if (emailHasUnsavedChanges) {
      toast.error(
        l(
          "Önce yeni e-posta adresini kaydet.",
          "Save your new email address first.",
          "Сначала сохраните новый адрес электронной почты.",
          "บันทึกอีเมลใหม่ก่อน",
          "Guarda primero tu nuevo correo electrónico.",
          "请先保存新的邮箱地址。",
        ),
      );
      return;
    }

    setIsResendingVerification(true);
    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : l(
                "Doğrulama e-postası gönderilemedi.",
                "Failed to send verification email.",
                "Не удалось отправить письмо для подтверждения.",
                "ส่งอีเมลยืนยันไม่สำเร็จ",
                "No se pudo enviar el correo de verificación.",
                "发送验证邮件失败。",
              ),
        );
      }

      toast.success(
        l(
          "Doğrulama e-postası gönderildi.",
          "Verification email sent.",
          "Письмо для подтверждения отправлено.",
          "ส่งอีเมลยืนยันแล้ว",
          "Correo de verificación enviado.",
          "验证邮件已发送。",
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : l(
              "Doğrulama e-postası gönderilemedi.",
              "Failed to send verification email.",
              "Не удалось отправить письмо для подтверждения.",
              "ส่งอีเมลยืนยันไม่สำเร็จ",
              "No se pudo enviar el correo de verificación.",
              "发送验证邮件失败。",
            ),
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEmailLoading(true);
      try {
        const res = await fetch("/api/user/email", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setAccountEmail("");
            setEmailInput("");
            setEmailVerified(false);
          }
          return;
        }
        const data = (await res.json()) as { email?: string | null; emailVerified?: boolean };
        if (!cancelled) {
          const next = data.email?.trim() ? data.email : "";
          setAccountEmail(next);
          setEmailInput(next);
          setEmailVerified(data.emailVerified === true);
        }
      } catch {
        if (!cancelled) {
          toast.error(t("settings.error.emailLoad"));
        }
      } finally {
        if (!cancelled) setEmailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCompanionLocaleLoading(true);
      try {
        const res = await fetch("/api/user/companion-locale", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { locale?: string };
        if (!cancelled && data.locale && APP_LOCALES.some((item) => item.value === data.locale)) {
          setCompanionLocale(data.locale as AppLocale);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setCompanionLocaleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveCompanionLocale = async (nextLocale: AppLocale) => {
    const previousLocale = companionLocale;
    setCompanionLocale(nextLocale);
    try {
      const response = await fetch("/api/user/companion-locale", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      if (!response.ok) {
        throw new Error("companion locale save failed");
      }
      toast.success(t("auth.register.locale"));
    } catch {
      setCompanionLocale(previousLocale);
      toast.error(t("settings.error.savePreferences"));
    }
  };

  useEffect(() => {
    setDisplayName(profile?.displayName ?? profile?.username ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
    setGender(profile?.gender ?? "");
    setBirthDate(formatDateOnly(profile?.birthDate) ?? "");
    setOccupation(profile?.occupation ?? "");
    setIncomeBand(profile?.declaredMonthlyIncomeBand ?? "");
    setCity(profile?.city ?? "");
    setWebsite(profile?.website ?? "");
    setBio(profile?.bio ?? "");
    setNameColor(profile?.nameColor ?? null);
    setProfileFrame(profile?.profileFrame ?? null);
    setThemeAccent(profile?.themeAccent ?? null);
    setProfileBg(profile?.profileBg ?? null);
    setAvatarSticker(profile?.avatarSticker ?? null);
    setSeal(profile?.seal ?? null);
  }, [profile]);

  // Owned season-pass cosmetics — ORed into every cosmetic gate so granted season
  // items become selectable even below the account level that opens the base set.
  useEffect(() => {
    let alive = true;
    fetch("/api/user/cosmetic-grants", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { grants: [] }))
      .then((d) => {
        if (alive) setCosmeticGrants(Array.isArray(d?.grants) ? d.grants : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const accountCountry = normalizeCountryCode(profile?.country) ?? "";
  const themeAccentPreviewHex = resolveThemeAccentHex(themeAccent, theme);

  const accountLevel = profile?.accountLevel ?? 1;
  const nameColorUnlocked = isNameColorUnlocked(accountLevel, cosmeticGrants);
  const frameUnlocked = isProfileFrameUnlocked(accountLevel, cosmeticGrants);
  const accentUnlocked = isThemeAccentUnlocked(accountLevel, cosmeticGrants);
  const bgUnlocked = isProfileBgUnlocked(accountLevel, cosmeticGrants);
  const stickerUnlocked = isAvatarStickerUnlocked(cosmeticGrants);
  const sealUnlocked = isSealUnlocked(accountLevel, cosmeticGrants);
  const accountXp = profile?.accountXp ?? 0;
  const levelPrev = ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel - 1] ?? 0;
  const levelNext =
    ACCOUNT_LEVEL_XP_THRESHOLDS[accountLevel] ??
    ACCOUNT_LEVEL_XP_THRESHOLDS[ACCOUNT_LEVEL_XP_THRESHOLDS.length - 1];
  const xpInLevel = Math.max(0, accountXp - levelPrev);
  const xpRange = Math.max(1, levelNext - levelPrev);
  const xpPct = Math.min((xpInLevel / xpRange) * 100, 100);
  const initials = (displayName || profile?.username || "U").slice(0, 2).toUpperCase();

  const stats = [
      {
        label: l("Hesap seviyesi", "Account level", "Уровень аккаунта", "ระดับบัญชี", "Nivel de cuenta", "账号等级"),
        value: `Lv ${accountLevel}`,
      },
      {
        label: l("Seri", "Streak", "Серия", "สตรีค", "Racha", "连续记录"),
        value: `${profile?.streak ?? 0}`,
      },
  ];

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(l("Profil fotoğrafı bir görsel olmalı.", "Profile photo must be an image.", "Фото профиля должно быть изображением.", "รูปโปรไฟล์ต้องเป็นไฟล์ภาพ", "La foto de perfil debe ser una imagen.", "头像必须是图片文件。"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploadingAvatar(true);
    try {
      const response = await fetch("/api/user/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || l("Profil fotoğrafı yüklenemedi.", "Profile photo could not be uploaded.", "Не удалось загрузить фото профиля.", "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ", "No se pudo subir la foto de perfil.", "无法上传头像。"));
      }

      const nextAvatarUrl = typeof data?.avatarUrl === "string" ? data.avatarUrl : "";
      setAvatarUrl(nextAvatarUrl);
      await patchCachedProfileAvatar(nextAvatarUrl || null);
      await refresh();
      toast.success(l("Profil fotoğrafı güncellendi.", "Profile photo updated.", "Фото профиля обновлено.", "อัปเดตรูปโปรไฟล์แล้ว", "Foto de perfil actualizada.", "头像已更新。"));
    } catch (error) {
      console.error("[profile-workspace] avatar upload failed", error);
      toast.error(error instanceof Error ? translateApiError(error.message, t, true) :l("Profil fotoğrafı yüklenemedi.", "Profile photo could not be uploaded.", "Не удалось загрузить фото профиля.", "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ", "No se pudo subir la foto de perfil.", "无法上传头像。"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      const response = await fetch("/api/user/profile/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || l("Profil fotoğrafı kaldırılamadı.", "Profile photo could not be removed.", "Не удалось удалить фото профиля.", "ลบรูปโปรไฟล์ไม่สำเร็จ", "No se pudo eliminar la foto de perfil.", "无法删除头像。"));
      }

      setAvatarUrl("");
      await patchCachedProfileAvatar(null);
      await refresh();
      toast.success(l("Profil fotoğrafı kaldırıldı.", "Profile photo removed.", "Фото профиля удалено.", "ลบรูปโปรไฟล์แล้ว", "Foto de perfil eliminada.", "头像已移除。"));
    } catch (error) {
      console.error("[profile-workspace] avatar remove failed", error);
      toast.error(error instanceof Error ? translateApiError(error.message, t, true) :l("Profil fotoğrafı kaldırılamadı.", "Profile photo could not be removed.", "Не удалось удалить фото профиля.", "ลบรูปโปรไฟล์ไม่สำเร็จ", "No se pudo eliminar la foto de perfil.", "无法删除头像。"));
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!displayName.trim()) {
      toast.error(t("settings.error.displayNameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      if (emailHasUnsavedChanges) {
        const emailResponse = await fetch("/api/user/email", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.trim(),
          }),
        });

        const emailBody = await emailResponse.json().catch(() => ({}));

        if (!emailResponse.ok) {
          const emailMessage =
            typeof emailBody.error === "string"
              ? emailBody.error
              : emailResponse.status === 409
                ? t("settings.error.emailInUse")
                : t("settings.error.emailSave");
          throw new Error(emailMessage);
        }

        const nextEmail = typeof emailBody.email === "string" ? emailBody.email : emailInput.trim();
        const nextVerified = emailBody.emailVerified === true;
        setAccountEmail(nextEmail);
        setEmailInput(nextEmail);
        setEmailVerified(nextVerified);
      }

      const response = await fetch("/api/user/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          gender: gender || null,
          birthDate: birthDate || null,
          occupation: occupation.trim() || null,
          declaredMonthlyIncomeBand: incomeBand || null,
          city: city.trim() || null,
          country: accountCountry || null,
          website: website.trim() || null,
          bio: bio.trim() || null,
          nameColor: nameColor,
          profileFrame: profileFrame,
          themeAccent: themeAccent,
          profileBg: profileBg,
          avatarSticker: avatarSticker,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || t("settings.error.saveProfile"));
      }

      const savedBody = (await response.json().catch(() => null)) as { birthDate?: string | null } | null;
      const savedBirthDate = formatDateOnly(savedBody?.birthDate ?? (birthDate || null));

      await patchCachedProfileFields({
        displayName: displayName.trim(),
        gender: gender || null,
        birthDate: savedBirthDate,
        occupation: occupation.trim() || null,
        city: city.trim() || null,
        country: accountCountry || null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        // Cosmetics are grandfathered: send the raw loaded value so a legacy
        // account-earned cosmetic isn't wiped from the local cache when its picker
        // is now season-locked (the server likewise keeps it — karar 2026-07-14).
        nameColor: nameColor,
        profileFrame: profileFrame,
        themeAccent: themeAccent,
        profileBg: profileBg,
        avatarSticker: stickerUnlocked ? avatarSticker : null,
        seal: sealUnlocked ? seal : null,
        declaredMonthlyIncomeBand: incomeBand || null,
      });
      if (savedBirthDate) {
        setBirthDate(savedBirthDate);
      }

      await syncMobileData({ force: true, fullProfile: true });
      await refresh();
      toast.success(t("settings.saved"));
      onDone?.();
    } catch (error) {
      console.error("[profile-workspace] save failed", error);
      toast.error(error instanceof Error ? translateApiError(error.message, t, true) :t("settings.error.saveAccount"));
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await clearAuthenticatedSessionCache();
      window.location.href = "/app/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const saveEmail = async () => {
    setIsSavingEmail(true);
    try {
      if (!emailInput.trim()) {
        toast.error(t("settings.error.emailInvalid"));
        return;
      }
      const response = await fetch("/api/user/email", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : response.status === 409
              ? t("settings.error.emailInUse")
              : t("settings.error.emailSave");
        throw new Error(msg);
      }

      const nextEmail = typeof body.email === "string" ? body.email : emailInput.trim();
      const nextVerified = body.emailVerified === true;
      setAccountEmail(nextEmail);
      setEmailInput(nextEmail);
      setEmailVerified(nextVerified);
      toast.success(t("settings.emailSaved"));
      if (!nextVerified && body.emailSent === false) {
        toast.error(t("auth.verify.resendError"));
      } else if (!nextVerified) {
        toast.info(t("settings.emailVerifyReminder"));
      }
    } catch (error: unknown) {
      console.error("[profile-workspace] save email failed", error);
      toast.error(error instanceof Error ? translateApiError(error.message, t, true) :t("settings.error.emailSave"));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const changePassword = async () => {
    const passwordErrorMessage = (message?: string) => {
      if (locale !== "tr" || !message) return message;

      const messages: Record<string, string> = {
        "Unauthorized": "Oturum bulunamadı. Lütfen tekrar giriş yap.",
        "Current password and new password are required": "Mevcut şifre ve yeni şifre zorunlu.",
        "Password must be at least 8 characters": "Yeni şifre en az 8 karakter olmalı.",
        "Current password is incorrect": "Mevcut şifre hatalı.",
        "Failed to change password": "Şifre değiştirilemedi.",
      };
      return messages[message] ?? message;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(l("Tüm şifre alanlarını doldur.", "Fill in all password fields.", "Заполни все поля пароля.", "กรอกข้อมูลรหัสผ่านให้ครบทุกช่อง", "Completa todos los campos de contraseña.", "请填写所有密码字段。"));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(l("Yeni şifre en az 8 karakter olmalı.", "New password must be at least 8 characters.", "Новый пароль должен быть не короче 8 символов.", "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", "La nueva contraseña debe tener al menos 8 caracteres.", "新密码至少需要 8 个字符。"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(l("Yeni şifreler eşleşmiyor.", "New passwords do not match.", "Новые пароли не совпадают.", "รหัสผ่านใหม่ไม่ตรงกัน", "Las nuevas contraseñas no coinciden.", "新密码不一致。"));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(l("Yeni şifre mevcut şifreden farklı olmalı.", "New password must be different from your current password.", "Новый пароль должен отличаться от текущего.", "รหัสผ่านใหม่ต้องต่างจากรหัสเดิม", "La nueva contraseña debe ser diferente de la actual.", "新密码必须与当前密码不同。"));
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(passwordErrorMessage(data?.error) || l("Şifre değiştirilemedi.", "Failed to change password.", "Не удалось изменить пароль.", "เปลี่ยนรหัสผ่านไม่สำเร็จ", "No se pudo cambiar la contraseña.", "修改密码失败。"));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(l("Şifre başarıyla değiştirildi.", "Password changed successfully.", "Пароль успешно изменен.", "เปลี่ยนรหัสผ่านสำเร็จ", "Contraseña cambiada con éxito.", "密码修改成功。"));
    } catch (error) {
      console.error("[profile-workspace] change password failed", error);
      toast.error(error instanceof Error ? translateApiError(error.message, t, true) :l("Şifre değiştirilemedi.", "Failed to change password.", "Не удалось изменить пароль.", "เปลี่ยนรหัสผ่านไม่สำเร็จ", "No se pudo cambiar la contraseña.", "修改密码失败。"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sectionTitleClass = "text-sm font-semibold";
  const fieldClass =
    "bg-[var(--app-bg-base)] border-[var(--app-border)] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus-visible:ring-[var(--app-primary)]";
  const isPageVariant = variant === "page";

  if (isPageVariant) {
    const displayLabel = displayName.trim() || profile?.username || "User";
    const avatarLabel = displayLabel.slice(0, 2).toUpperCase();
    const heroLocation =[city.trim(), accountCountry ? getCountryByCode(accountCountry)?.name ?? accountCountry : ""]
      .filter(Boolean)
      .join(", ");
    const healthValue = Math.max(0, Math.min(100, Number(profile?.honor ?? 50) || 0));
    const streakValue = profile?.streak ?? 0;
    const streakBarFilled = getStreakBarFilledCount(streakValue);
    const bioCount = bio.trim().length;

    const quickStats = [
      {
        key: "health",
        label: l("Sağlık skoru", "Health score", "Здоровье", "สุขภาพ", "Salud", "健康"),
        value: `${healthValue}`,
        suffix: "/100",
        icon: <Heart className="h-4 w-4 text-[#8cf29f]" />,
        tint: "rgba(104, 255, 156, 0.12)",
        border: "rgba(104, 255, 156, 0.18)",
        text: "#8cf29f",
        progress: Math.max(14, healthValue),
      },
      {
        key: "streak",
        label: l("Seri", "Streak", "Серия", "สตรีค", "Racha", "连续"),
        value: `${streakValue}`,
        suffix: l(" gün", " day", " дн.", " วัน", " día", " 天"),
        icon: <Flame className="h-4 w-4 text-[#ffb15d]" />,
        tint: "rgba(255, 170, 88, 0.12)",
        border: "rgba(255, 170, 88, 0.18)",
        text: "#ffb15d",
        progress: streakBarFilled > 0 ? Math.max(14, (streakBarFilled / 7) * 100) : 12,
        streakBarFilled,
      },
    ];

    const pageQuickStats = [
      {
        key: "health",
        label: l("Sağlık skoru", "Health score", "Здоровье", "สุขภาพ", "Salud", "健康"),
        value: `${healthValue}`,
        suffix: "/100",
        icon: <Heart className="h-4 w-4 text-[#8cf29f]" />,
        tint: "rgba(104, 255, 156, 0.12)",
        border: "rgba(104, 255, 156, 0.18)",
        text: "#8cf29f",
        progress: Math.max(14, healthValue),
      },
      {
        key: "streak",
        label: l("Seri", "Streak", "Серия", "สตรีค", "Racha", "连续"),
        value: `${streakValue}`,
        suffix: l(" gün", " day", " дн.", " วัน", " día", " 天"),
        icon: <Flame className="h-4 w-4 text-[#ffb15d]" />,
        tint: "rgba(255, 170, 88, 0.12)",
        border: "rgba(255, 170, 88, 0.18)",
        text: "#ffb15d",
        progress: streakBarFilled > 0 ? Math.max(14, (streakBarFilled / 7) * 100) : 12,
        streakBarFilled,
      },
    ];

    const pageUtilityRows = [
      {
        key: "wallet" as const,
        icon: <Wallet className="h-[18px] w-[18px] text-[#f5a15d]" />,
        title: l("Cüzdan", "Wallet", "Кошелек", "กระเป๋า", "Billetera", "钱包"),
        description: l(
          "Bakiye, kartlar ve hareketler",
          "View balance, cards and transactions",
          "Баланс, карты и транзакции",
          "ดูยอดเงิน บัตร และธุรกรรม",
          "Ver saldo, tarjetas y transacciones",
          "查看余额、卡片和交易",
        ),
      },
      {
        key: "referrals" as const,
        icon: <Gift className="h-[18px] w-[18px] text-[#ff729b]" />,
        title: l("Davetler", "Referrals", "Рефералы", "การชวนเพื่อน", "Referidos", "邀请"),
        description: l(
          "Arkadaşlarını davet et ve puan kazan",
          "Invite friends and earn points",
          "Приглашай друзей и получай баллы",
          "ชวนเพื่อนและรับแต้ม",
          "Invita amigos y gana puntos",
          "邀请好友并赚取积分",
        ),
      },
      {
        key: "security" as const,
        icon: <Shield className="h-[18px] w-[18px] text-[#74d0ff]" />,
        title: l("Güvenlik", "Security", "Безопасность", "ความปลอดภัย", "Seguridad", "安全"),
        description: l(
          "Şifre, 2FA ve hesap güvenliği",
          "Password, 2FA and account security",
          "Пароль, 2FA и защита аккаунта",
          "รหัสผ่าน 2FA และความปลอดภัยบัญชี",
          "Contraseña, 2FA y seguridad de cuenta",
          "密码、2FA 和账户安全",
        ),
      },
    ];

    return (
      <div className="space-y-5 pb-24">
        <ThemeCard
          accountLevel={accountLevel}
          className="overflow-hidden rounded-[26px]"
          style={{
            borderColor: "var(--profile-hero-border, rgba(255, 176, 68, 0.34))",
            boxShadow: "var(--profile-hero-shadow, 0 0 0 1px rgba(255,176,68,0.05), 0 26px 52px rgba(0,0,0,0.28))",
          }}
        >
          <div
            className="relative p-5"
            style={{
              background:
                "var(--profile-hero-bg, radial-gradient(circle at top center, rgba(255,171,71,0.14), transparent 34%), linear-gradient(180deg, rgba(24,24,28,0.98) 0%, rgba(14,15,21,0.98) 100%))",
            }}
          >
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadAvatar(file);
              }}
            />

            <div className="mb-4 flex items-start justify-between gap-3">
              <div
                className="relative h-[96px] w-[96px] shrink-0 overflow-visible rounded-full border-2 border-[#f0a73e] shadow-[0_16px_34px_rgba(0,0,0,0.34)]"
                style={{ background: "var(--profile-avatar-bg, #10131a)" }}
              >
                <div className="h-full w-full overflow-hidden rounded-full">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl font-black text-white">
                      {avatarLabel}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border text-white shadow-[0_8px_18px_rgba(0,0,0,0.32)]"
                  style={{
                    background: "var(--profile-avatar-button-bg, #1a1c22)",
                    borderColor: "var(--app-border-strong, rgba(255,255,255,0.2))",
                  }}
                  aria-label={l("Fotoğraf değiştir", "Change photo", "Сменить фото", "เปลี่ยนรูป", "Cambiar foto", "更换头像")}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>

              <div className="min-w-0 flex-1 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="profile-hero-title text-[30px] font-semibold tracking-[-0.04em]">{displayLabel}</h1>
                  <span
                    className="inline-flex items-center rounded-full border border-[#f0b548]/60 bg-[#f0b548]/10 px-3 py-1 text-[13px] font-semibold"
                    style={{ color: "var(--profile-level-text, #f7cb63)" }}
                  >
                    {`Lv.${accountLevel}`}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[15px] text-white/72">
                  <MapPin className="h-4 w-4 text-white/60" />
                  <span>{heroLocation || "Istanbul, TR"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  document.getElementById("profile-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[#d8a83a]"
                aria-label={l("Tercihler", "Preferences", "Настройки", "การตั้งค่า", "Preferencias", "偏好设置")}
              >
                <Coins className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div
                className="h-3 overflow-hidden rounded-full"
                style={{ background: "var(--profile-track-bg, rgba(255,255,255,0.08))" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: "linear-gradient(90deg, #f5b819 0%, #f0c130 100%)",
                  }}
                />
              </div>
              <div className="text-[14px] text-white/72">
                <span className="font-semibold" style={{ color: "var(--profile-level-text, #f5b819)" }}>
                  {xpInLevel.toLocaleString(numLocale, { maximumFractionDigits: 0 })}
                </span>
                <span>{` / ${xpRange.toLocaleString(numLocale, { maximumFractionDigits: 0 })} XP to Level ${accountLevel + 1}`}</span>
              </div>
            </div>
          </div>
        </ThemeCard>

        <div className="grid grid-cols-2 gap-3">
          {pageQuickStats.map((item) => (
            <ThemeCard
              key={item.key}
              accountLevel={accountLevel}
              className="rounded-[22px]"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <div className="p-4">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                    {item.label}
                  </p>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full border"
                    style={{ background: item.tint, borderColor: item.border }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div className="min-h-[52px]">
                  <div className="flex items-end gap-1">
                    <span className="text-[22px] font-semibold tracking-[-0.03em]" style={{ color: item.text }}>
                      {item.value}
                    </span>
                    {item.suffix ? <span className="pb-1 text-[12px] text-white/72">{item.suffix}</span> : null}
                  </div>
                </div>
                {item.key === "streak" && "streakBarFilled" in item ? (
                  <div className="mt-4 flex gap-[3px]">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < (item as { streakBarFilled: number }).streakBarFilled
                            ? "bg-[#ff7a1a]"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                ) : item.progress > 0 ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.progress}%`, background: item.text }}
                    />
                  </div>
                ) : null}
              </div>
            </ThemeCard>
          ))}
        </div>

        <div id="profile-preferences" className="scroll-mt-28">
          <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#67e8f9]/30 bg-[#67e8f9]/10">
                  <Globe2 className="h-5 w-5 text-[#7dd3fc]" />
                </span>
                <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                  {l("Uygulama dili", "Application language", "Язык приложения", "ภาษาของแอป", "Idioma de la aplicación", "应用语言")}
                </h3>
              </div>
              <p className="text-[13px] leading-6 text-white/58">
                {l(
                  "Menüler, düğmeler ve uygulama ekranlarının dili.",
                  "Language for menus, buttons, and app screens.",
                  "Язык меню, кнопок и экранов приложения.",
                  "ภาษาสำหรับเมนู ปุ่ม และหน้าจอในแอป",
                  "Idioma de menús, botones y pantallas de la app.",
                  "菜单、按钮和应用界面的显示语言。",
                )}
              </p>
              <Select
                value={locale}
                onValueChange={(value) => {
                  setLocale(value as AppLocale);
                  toast.success(
                    l(
                      "Uygulama dili güncellendi",
                      "Application language updated",
                      "Язык приложения обновлён",
                      "อัปเดตภาษาของแอปแล้ว",
                      "Idioma de la aplicación actualizado",
                      "应用语言已更新",
                    ),
                  );
                }}
              >
                <SelectTrigger className="h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_LOCALES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <span className="mr-2">{item.flag}</span>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-3 border-t border-white/8 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{t("auth.register.locale")}</h4>
                  <p className="mt-1 text-[13px] leading-6 text-white/58">{t("auth.register.localeHint")}</p>
                </div>
                <Select
                  value={companionLocale}
                  onValueChange={(value) => void saveCompanionLocale(value as AppLocale)}
                  disabled={companionLocaleLoading}
                >
                  <SelectTrigger className="h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_LOCALES.map((item) => (
                      <SelectItem key={`companion-${item.value}`} value={item.value}>
                        <span className="mr-2">{item.flag}</span>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-white/48" />
                  <div>
                    <p className="text-sm font-semibold text-white">{t("settings.sound")}</p>
                    <p className="mt-0.5 text-[12px] text-white/52">{t("settings.soundDesc")}</p>
                  </div>
                </div>
                <Switch checked={soundPrefs.enabled} onCheckedChange={setSoundEnabled} aria-label={t("settings.sound")} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-white/78">{t("settings.sound.volume")}</Label>
                  <span className="text-xs font-mono tabular-nums text-white/52">{Math.round(soundPrefs.volume * 100)}%</span>
                </div>
                <Slider
                  value={[soundPrefs.volume]}
                  onValueChange={(v) => setSoundVolume(v?.[0] ?? 0)}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!soundPrefs.enabled}
                />
              </div>

              <div className="space-y-3 border-t border-white/8 pt-4">
                <p className="text-sm font-semibold text-white">
                  {l("Çerez tercihleri", "Cookie preferences", "Настройки cookie", "การตั้งค่าคุกกี้", "Preferencias de cookies", "Cookie 偏好设置")}
                </p>
                <p className="text-[13px] leading-6 text-white/58">
                  {l(
                    "Yumo Yumo için analitik ve rıza çerezlerini yönet.",
                    "Manage analytics and consent cookies for Yumo Yumo.",
                    "Управляйте аналитическими и consent-cookie Yumo Yumo.",
                    "จัดการคุกกี้วิเคราะห์และความยินยอมของ Yumo Yumo",
                    "Gestiona cookies de analítica y consentimiento de Yumo Yumo.",
                    "管理 Yumo Yumo 的分析与同意类 Cookie。",
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openCookiePreferences}
                  className="h-11 w-full rounded-[16px] border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                >
                  {l(
                    "Çerez tercihlerini aç",
                    "Open cookie preferences",
                    "Открыть настройки cookie",
                    "เปิดการตั้งค่าคุกกี้",
                    "Abrir preferencias de cookies",
                    "打开 Cookie 偏好设置",
                  )}
                </Button>
              </div>
            </div>
          </ThemeCard>
        </div>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff8b3d]/30 bg-[#ff8b3d]/10">
                <Mail className="h-5 w-5 text-[#ff9a3d]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {l("Hesap", "Account", "???????", "?????", "Cuenta", "??")}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="profile-account-email" className="text-sm text-white/78">
                    {t("settings.email")}
                  </Label>
                  {!emailLoading ? (
                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        color: emailHasUnsavedChanges ? "#54d8fb" : emailVerified ? "#8cf29f" : "#f7cb63",
                        background: emailHasUnsavedChanges
                          ? "rgba(84,216,251,0.10)"
                          : emailVerified
                            ? "rgba(140,242,159,0.10)"
                            : "rgba(247,203,99,0.10)",
                      }}
                    >
                      {emailHasUnsavedChanges
                        ? t("settings.emailUnsaved")
                        : emailVerified
                          ? t("settings.emailVerified")
                          : t("settings.emailUnverified")}
                    </span>
                  ) : null}
                </div>
                <Input
                  id="profile-account-email"
                  type="email"
                  autoComplete="email"
                  value={emailLoading ? "" : emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={t("settings.emailPlaceholder")}
                  className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                  disabled={emailLoading}
                />
                {!emailLoading && !emailVerified ? (
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-3">
                    <p className="text-[13px] leading-6 text-white/64">
                      {emailHasUnsavedChanges
                        ? l(
                            "Doğrulama linki göndermek için önce yeni e-posta adresini kaydet.",
                            "Save your new email address before sending a verification link.",
                            "Сначала сохраните новый адрес электронной почты, чтобы отправить ссылку для подтверждения.",
                            "บันทึกอีเมลใหม่ก่อนส่งลิงก์ยืนยัน",
                            "Guarda tu nuevo correo antes de enviar el enlace de verificación.",
                            "发送验证链接前请先保存新的邮箱地址。",
                          )
                        : l(
                            "E-posta adresin henüz doğrulanmamış. Buradan tekrar doğrulama e-postası gönderebilirsin.",
                            "Your email address is not verified yet. You can resend the verification email here.",
                            "Адрес электронной почты пока не подтвержден. Здесь можно повторно отправить письмо.",
                            "อีเมลของคุณยังไม่ได้ยืนยัน คุณสามารถส่งอีเมลยืนยันอีกครั้งได้ที่นี่",
                            "Tu correo aún no está verificado. Puedes reenviar el correo de verificación aquí.",
                            "你的邮箱尚未验证，可以在这里重新发送验证邮件。",
                          )}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resendVerificationEmail}
                        disabled={emailHasUnsavedChanges || isResendingVerification}
                        className="h-11 rounded-[14px] border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                      >
                        {isResendingVerification ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        {locale === "tr" ? "Doğrulama maili gönder" : "Send verification email"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push("/app/verify-email")}
                        className="h-11 rounded-[14px] text-white/74 hover:bg-white/[0.05] hover:text-white"
                      >
                        {locale === "tr" ? "Doğrulama ekranını aç" : "Open verification screen"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-display-name" className="text-sm text-white/78">
                  {t("settings.displayName")}
                </Label>
                <Input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                  className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                />
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b15cff]/30 bg-[#b15cff]/10">
                <UserRound className="h-5 w-5 text-[#bf74ff]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {locale === "tr" ? "Kişisel bilgiler" : "Personal info"}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="profile-gender" className="text-sm text-white/78">
                  {t("settings.gender")}
                </Label>
                <Select value={gender || "unset"} onValueChange={(value) => setGender(value === "unset" ? "" : value)}>
                  <SelectTrigger id="profile-gender" className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white ${fieldClass}`}>
                    <SelectValue placeholder={t("settings.genderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">{l("Belirtmek istemiyorum", "Prefer not to say", "Не указывать", "ไม่ระบุ", "Prefiero no decirlo", "不想透露")}</SelectItem>
                    <SelectItem value="male">{t("settings.gender.male")}</SelectItem>
                    <SelectItem value="female">{t("settings.gender.female")}</SelectItem>
                    <SelectItem value="non-binary">{t("settings.gender.nonBinary")}</SelectItem>
                    <SelectItem value="other">{t("settings.gender.other")}</SelectItem>
                    <SelectItem value="prefer-not-to-say">{t("settings.gender.preferNotToSay")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-birthdate" className="text-sm text-white/78">
                  {t("settings.birthDate")}
                </Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/44" />
                  <Input
                    id="profile-birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] pr-11 text-[17px] text-white ${fieldClass}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-occupation" className="text-sm text-white/78">
                  {t("settings.occupation")}
                </Label>
                <Input
                  id="profile-occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder={t("settings.occupationPlaceholder")}
                  className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                />
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffc12d]/30 bg-[#ffc12d]/10">
                <Wallet className="h-5 w-5 text-[#ffc12d]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {locale === "tr" ? "Finansal bağlam" : "Financial context"}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="profile-income" className="text-sm text-white/78">
                  {t("settings.monthlyIncome")}
                </Label>
              </div>
              <div className="space-y-2">
                <IncomeBandSelect
                  id="profile-income"
                  value={incomeBand}
                  onValueChange={setIncomeBand}
                  countryCode={accountCountry}
                  locale={locale}
                  className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white ${fieldClass}`}
                  placeholder={t("settings.monthlyIncomePlaceholder")}
                />
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#55c9ff]/30 bg-[#55c9ff]/10">
                <MapPin className="h-5 w-5 text-[#55c9ff]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {l("Konum", "Location", "???????", "???????", "Ubicaci?n", "??")}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-city" className="text-sm text-white/78">
                  {l("Şehir", "City", "Город", "เมือง", "Ciudad", "城市")}
                </Label>
                <Input
                  id="profile-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={l("Istanbul", "Istanbul", "Москва", "กรุงเทพฯ", "Madrid", "上海")}
                  className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-country" className="text-sm text-white/78">
                  {l("Ülke", "Country", "Страна", "ประเทศ", "País", "国家")}
                </Label>
                <div className="flex h-14 items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.02] px-4">
                  <span className={`text-[17px] ${accountCountry ? "text-white" : "text-white/40"}`}>
                    {accountCountry
                      ? isOtherCountry(accountCountry)
                        ? l("Diğer", "Other", "Другое", "อื่นๆ", "Otro", "其他")
                        : getCountryByCode(accountCountry)?.name ?? accountCountry
                      : l("Seçilmedi", "Not selected", "Не выбрано", "ยังไม่ได้เลือก", "No seleccionado", "未选择")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Lock className="h-3.5 w-3.5" />
                    {l("Sabit", "Locked", "Зафиксировано", "ล็อก", "Fijo", "已锁定")}
                  </span>
                </div>
                <p className="text-xs leading-5 text-white/40">
                  {l("Kayıt sırasında seçilen ülke değiştirilemez.", "The country chosen at signup can't be changed.", "Страну, выбранную при регистрации, изменить нельзя.", "ประเทศที่เลือกตอนสมัครไม่สามารถเปลี่ยนได้", "El país elegido al registrarte no se puede cambiar.", "注册时选择的国家无法更改。")}
                </p>
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#87ee3c]/30 bg-[#87ee3c]/10">
                <Link2 className="h-5 w-5 text-[#87ee3c]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {l("Linkler", "Links", "??????", "?????", "Enlaces", "??")}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="profile-website" className="text-sm text-white/78">
                  {l("Website / sosyal link", "Website / social link", "???? / ?????????", "???????? / ????????????", "Sitio web / enlace social", "?? / ????")}
                </Label>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/44" />
                  <Input
                    id="profile-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://linkedin.com/in/ugur"
                    className={`h-14 rounded-[16px] border-white/10 bg-white/[0.03] pl-11 text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff9a30]/30 bg-[#ff9a30]/10">
                <MessageSquareText className="h-5 w-5 text-[#ff9a30]" />
              </span>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                {locale === "tr" ? "Hakkında" : "About"}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label htmlFor="profile-bio" className="text-sm text-white/78">
                  {locale === "tr" ? "Kısa biyografi" : "Short bio"}
                </Label>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={
                      locale === "tr"
                        ? "Kendinden, hedeflerinden ve ilgilerinden kısaca bahset."
                        : "Passionate about technology, finance and building products that make life easier."
                    }
                    className={`min-h-[122px] rounded-[16px] border-white/10 bg-white/[0.03] pr-14 text-[17px] text-white placeholder:text-white/28 ${fieldClass}`}
                    maxLength={200}
                  />
                  <span className="absolute bottom-4 right-4 text-[12px] text-white/52">{`${bioCount}/200`}</span>
                </div>
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10">
                  <Palette className="h-5 w-5 text-[#a78bfa]" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                    {l("İsim rengi", "Name color", "Name color", "Name color", "Color del nombre", "Name color")}
                  </h3>
                  <p className="text-[12px] text-white/52">
                    {l("Adını renkle öne çıkar.", "Highlight your name with color.", "Highlight your name with color.", "Highlight your name with color.", "Resalta tu nombre con color.", "Highlight your name with color.")}
                  </p>
                </div>
              </div>
              {!nameColorUnlocked && (
                <span className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[11px] font-semibold text-white/60">
                  <Lock className="h-3 w-3" />
                  {l("Sezon", "Season", "Season", "Season", "Temporada", "Season")}
                </span>
              )}
            </div>

            {nameColorUnlocked ? (
              <div className="space-y-4">
                {/* Live preview of the chosen color on the current display name. */}
                <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span
                    className="text-[22px] font-bold tracking-[-0.01em]"
                    style={{ color: resolveNameColorHex(nameColor, theme) ?? "#ffffff" }}
                  >
                    {displayName.trim() || profile?.username || l("Kullanıcı", "User", "User", "User", "Usuario", "User")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {/* Default — no override. */}
                  <button
                    type="button"
                    onClick={() => setNameColor(null)}
                    aria-label={l("Varsayılan", "Default", "Default", "Default", "Predeterminado", "Default")}
                    aria-pressed={nameColor === null}
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-bold text-white/70 transition-transform hover:scale-[1.06] active:scale-95"
                    style={{
                      borderColor: nameColor === null ? "#ffffff" : "rgba(255,255,255,0.18)",
                      boxShadow: nameColor === null ? "0 0 0 2px rgba(255,255,255,0.25)" : "none",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    A
                  </button>
                  {availableNameColors(accountLevel, cosmeticGrants).map((swatch) => {
                    const hex = theme === "light" ? swatch.light : swatch.dark;
                    const selected = nameColor === swatch.key;
                    return (
                      <button
                        key={swatch.key}
                        type="button"
                        onClick={() => setNameColor(swatch.key)}
                        aria-label={l(swatch.label.tr, swatch.label.en, swatch.label.en, swatch.label.en, swatch.label.en, swatch.label.en)}
                        aria-pressed={selected}
                        className="flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-[1.06] active:scale-95"
                        style={{
                          background: hex,
                          borderColor: selected ? "#ffffff" : "transparent",
                          boxShadow: selected ? `0 0 0 2px ${hex}66` : "none",
                        }}
                      >
                        <span className="text-[13px] font-black" style={{ color: "rgba(0,0,0,0.55)" }}>A</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-white/60">
                {l(
                  "İsim renkleri sezon geçişinden kazanılır — sezon seviyeni yükselttikçe açılır.",
                  "Name colors are earned from the season pass — they unlock as you raise your season level.",
                  "Name colors are earned from the season pass — they unlock as you raise your season level.",
                  "Name colors are earned from the season pass — they unlock as you raise your season level.",
                  "Los colores de nombre se ganan en el pase de temporada; se desbloquean al subir tu nivel de temporada.",
                  "Name colors are earned from the season pass — they unlock as you raise your season level.",
                )}
              </p>
            )}
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10">
                  <Shield className="h-5 w-5 text-[#F5A623]" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                    {l("Profil çerçevesi", "Profile frame", "Profile frame", "Profile frame", "Marco de perfil", "Profile frame")}
                  </h3>
                  <p className="text-[12px] text-white/52">
                    {l("Avatarını çevreleyen çerçeve.", "A ring around your avatar.", "A ring around your avatar.", "A ring around your avatar.", "Un anillo alrededor de tu avatar.", "A ring around your avatar.")}
                  </p>
                </div>
              </div>
              {!frameUnlocked && (
                <span className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[11px] font-semibold text-white/60">
                  <Lock className="h-3 w-3" />
                  {l("Sezon", "Season", "Season", "Season", "Temporada", "Season")}
                </span>
              )}
            </div>

            {frameUnlocked ? (
              <div className="flex flex-wrap items-center gap-3">
                {/* None — no frame. */}
                <button
                  type="button"
                  onClick={() => setProfileFrame(null)}
                  aria-label={l("Yok", "None", "None", "None", "Ninguno", "None")}
                  aria-pressed={profileFrame === null}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full border text-[11px] font-bold text-white/60"
                    style={{
                      borderColor: profileFrame === null ? "#ffffff" : "rgba(255,255,255,0.18)",
                      boxShadow: profileFrame === null ? "0 0 0 2px rgba(255,255,255,0.25)" : "none",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    {l("Yok", "None", "None", "None", "—", "None")}
                  </span>
                </button>
                {availableProfileFrames(accountLevel, cosmeticGrants).map((frame) => {
                  const selected = profileFrame === frame.key;
                  return (
                    <button
                      key={frame.key}
                      type="button"
                      onClick={() => setProfileFrame(frame.key)}
                      aria-label={l(frame.label.tr, frame.label.en, frame.label.en, frame.label.en, frame.label.en, frame.label.en)}
                      aria-pressed={selected}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <AvatarFrame frameKey={frame.key}>
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-full text-[13px] font-bold text-white/85"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            outline: selected ? "2px solid #ffffff" : "none",
                            outlineOffset: 2,
                          }}
                        >
                          {(displayName.trim() || profile?.username || "Y").slice(0, 1).toUpperCase()}
                        </span>
                      </AvatarFrame>
                      <span className="text-[10px] font-medium text-white/55">
                        {l(frame.label.tr, frame.label.en, frame.label.en, frame.label.en, frame.label.en, frame.label.en)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-white/60">
                {l(
                  "Çerçeveler sezon geçişinden kazanılır — sezon seviyeni yükselttikçe yeni çerçeveler açılır.",
                  "Frames are earned from the season pass — new frames unlock as you raise your season level.",
                  "Frames are earned from the season pass — new frames unlock as you raise your season level.",
                  "Frames are earned from the season pass — new frames unlock as you raise your season level.",
                  "Los marcos se ganan en el pase de temporada; se desbloquean al subir tu nivel de temporada.",
                  "Frames are earned from the season pass — new frames unlock as you raise your season level.",
                )}
              </p>
            )}
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{ borderColor: `${themeAccentPreviewHex ?? "#F5A623"}55`, background: `${themeAccentPreviewHex ?? "#F5A623"}1a` }}
                >
                  <Palette className="h-5 w-5" style={{ color: themeAccentPreviewHex ?? "#F5A623" }} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                    {l("Tema aksanı", "Theme accent", "Theme accent", "Theme accent", "Acento del tema", "Theme accent")}
                  </h3>
                  <p className="text-[12px] text-white/52">
                    {l("Uygulamanın vurgu rengini seç.", "Pick the app's highlight color.", "Pick the app's highlight color.", "Pick the app's highlight color.", "Elige el color de acento de la app.", "Pick the app's highlight color.")}
                  </p>
                </div>
              </div>
              {!accentUnlocked && (
                <span className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[11px] font-semibold text-white/60">
                  <Lock className="h-3 w-3" />
                  {l("Sezon", "Season", "Season", "Season", "Temporada", "Season")}
                </span>
              )}
            </div>

            {accentUnlocked ? (
              <div className="flex flex-wrap gap-2.5">
                {/* Default — brand accent. */}
                <button
                  type="button"
                  onClick={() => setThemeAccent(null)}
                  aria-label={l("Varsayılan", "Default", "Default", "Default", "Predeterminado", "Default")}
                  aria-pressed={themeAccent === null}
                  className="flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-[1.06] active:scale-95"
                  style={{
                    background: "#F5A623",
                    borderColor: themeAccent === null ? "#ffffff" : "transparent",
                    boxShadow: themeAccent === null ? "0 0 0 2px #F5A62366" : "none",
                  }}
                >
                  <span className="text-[13px] font-black" style={{ color: "rgba(0,0,0,0.55)" }}>A</span>
                </button>
                {availableThemeAccents(accountLevel, cosmeticGrants).map((sw) => {
                  const hex = theme === "light" ? sw.light : sw.dark;
                  const selected = themeAccent === sw.key;
                  return (
                    <button
                      key={sw.key}
                      type="button"
                      onClick={() => setThemeAccent(sw.key)}
                      aria-label={l(sw.label.tr, sw.label.en, sw.label.en, sw.label.en, sw.label.en, sw.label.en)}
                      aria-pressed={selected}
                      className="flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-[1.06] active:scale-95"
                      style={{
                        background: hex,
                        borderColor: selected ? "#ffffff" : "transparent",
                        boxShadow: selected ? `0 0 0 2px ${hex}66` : "none",
                      }}
                    >
                      <span className="text-[13px] font-black" style={{ color: "rgba(0,0,0,0.55)" }}>A</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-white/60">
                {l(
                  "Tema aksanları sezon geçişinden kazanılır — sezon seviyeni yükselttikçe açılır.",
                  "Theme accents are earned from the season pass — they unlock as you raise your season level.",
                  "Theme accents are earned from the season pass — they unlock as you raise your season level.",
                  "Theme accents are earned from the season pass — they unlock as you raise your season level.",
                  "Los acentos de tema se ganan en el pase de temporada; se desbloquean al subir tu nivel de temporada.",
                  "Theme accents are earned from the season pass — they unlock as you raise your season level.",
                )}
              </p>
            )}
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10">
                  <UserRound className="h-5 w-5 text-[#38bdf8]" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                    {l("Profil arka planı", "Profile background", "Profile background", "Profile background", "Fondo de perfil", "Profile background")}
                  </h3>
                  <p className="text-[12px] text-white/52">
                    {l("Profil kartının arka planını seç.", "Pick your profile card backdrop.", "Pick your profile card backdrop.", "Pick your profile card backdrop.", "Elige el fondo de tu tarjeta de perfil.", "Pick your profile card backdrop.")}
                  </p>
                </div>
              </div>
              {!bgUnlocked && (
                <span className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[11px] font-semibold text-white/60">
                  <Lock className="h-3 w-3" />
                  {l("Sezon", "Season", "Season", "Season", "Temporada", "Season")}
                </span>
              )}
            </div>

            {bgUnlocked ? (
              <div className="flex flex-wrap gap-2.5">
                {/* Default — no background. */}
                <button
                  type="button"
                  onClick={() => setProfileBg(null)}
                  aria-label={l("Varsayılan", "Default", "Default", "Default", "Predeterminado", "Default")}
                  aria-pressed={profileBg === null}
                  className="flex h-12 w-16 items-center justify-center rounded-[10px] border text-[10px] font-bold text-white/60 transition-transform hover:scale-[1.04] active:scale-95"
                  style={{
                    borderColor: profileBg === null ? "#ffffff" : "rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  {l("Yok", "None", "None", "None", "—", "None")}
                </button>
                {availableProfileBackgrounds(accountLevel, cosmeticGrants).map((bg) => {
                  const css = theme === "light" ? bg.light : bg.dark;
                  const selected = profileBg === bg.key;
                  return (
                    <button
                      key={bg.key}
                      type="button"
                      onClick={() => setProfileBg(bg.key)}
                      aria-label={l(bg.label.tr, bg.label.en, bg.label.en, bg.label.en, bg.label.en, bg.label.en)}
                      aria-pressed={selected}
                      className="h-12 w-16 rounded-[10px] border transition-transform hover:scale-[1.04] active:scale-95"
                      style={{
                        background: css,
                        borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.14)",
                        boxShadow: selected ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-white/60">
                {l(
                  "Profil arka planı sezon geçişinden kazanılır — sezon seviyeni yükselttikçe açılır.",
                  "The profile background is earned from the season pass — it unlocks as you raise your season level.",
                  "The profile background is earned from the season pass — it unlocks as you raise your season level.",
                  "The profile background is earned from the season pass — it unlocks as you raise your season level.",
                  "El fondo de perfil se gana en el pase de temporada; se desbloquea al subir tu nivel de temporada.",
                  "The profile background is earned from the season pass — it unlocks as you raise your season level.",
                )}
              </p>
            )}
          </div>
        </ThemeCard>

        <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 text-lg">
                  {"✨"}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                    {l("Avatar rozeti", "Avatar sticker", "Avatar sticker", "Avatar sticker", "Sticker de avatar", "Avatar sticker")}
                  </h3>
                  <p className="text-[12px] text-white/52">
                    {l("Avatarının köşesine küçük bir simge.", "A small icon on your avatar's corner.", "A small icon on your avatar's corner.", "A small icon on your avatar's corner.", "Un pequeño ícono en la esquina de tu avatar.", "A small icon on your avatar's corner.")}
                  </p>
                </div>
              </div>
              {!stickerUnlocked && (
                <span className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[11px] font-semibold text-white/60">
                  <Lock className="h-3 w-3" />
                  {l("Sezon", "Season", "Season", "Season", "Temporada", "Season")}
                </span>
              )}
            </div>

            {stickerUnlocked ? (
              <div className="flex flex-wrap gap-2.5">
                {/* None — no sticker. */}
                <button
                  type="button"
                  onClick={() => setAvatarSticker(null)}
                  aria-label={l("Yok", "None", "None", "None", "Ninguno", "None")}
                  aria-pressed={avatarSticker === null}
                  className="flex h-10 w-10 items-center justify-center rounded-full border text-[10px] font-bold text-white/60 transition-transform hover:scale-[1.06] active:scale-95"
                  style={{
                    borderColor: avatarSticker === null ? "#ffffff" : "rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  {l("Yok", "None", "None", "None", "—", "None")}
                </button>
                {availableAvatarStickers(cosmeticGrants).map((st) => {
                  const selected = avatarSticker === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setAvatarSticker(st.key)}
                      aria-label={l(st.label.tr, st.label.en, st.label.en, st.label.en, st.label.en, st.label.en)}
                      aria-pressed={selected}
                      className="flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-transform hover:scale-[1.06] active:scale-95"
                      style={{
                        borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.14)",
                        boxShadow: selected ? "0 0 0 2px rgba(255,255,255,0.28)" : "none",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      {st.emoji}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-6 text-white/60">
                {l(
                  "Avatar rozetleri sezon geçişinden kazanılır — sezon seviyeni yükselttikçe açılır.",
                  "Avatar stickers are earned from the season pass — they unlock as you raise your season level.",
                  "Avatar stickers are earned from the season pass — they unlock as you raise your season level.",
                  "Avatar stickers are earned from the season pass — they unlock as you raise your season level.",
                  "Los stickers de avatar se ganan en el pase de temporada; se desbloquean al subir tu nivel de temporada.",
                  "Avatar stickers are earned from the season pass — they unlock as you raise your season level.",
                )}
              </p>
            )}
          </div>
        </ThemeCard>

        {sealUnlocked && (
          <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
                  {l("Sezon Mührü", "Season Seal", "Season Seal", "Season Seal", "Sello de temporada", "Season Seal")}
                </h3>
                <p className="text-[12px] text-white/52">
                  {l("Doğrulanmış fişlerine basılır — harcaman kanıtlı.", "Stamped on your verified receipts.", "Stamped on your verified receipts.", "Stamped on your verified receipts.", "Se sella en tus recibos verificados.", "Stamped on your verified receipts.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSeal(null)}
                  aria-pressed={seal === null}
                  className="flex h-14 w-14 items-center justify-center rounded-full border text-[11px] font-bold text-white/60"
                  style={{ borderColor: seal === null ? "#ffffff" : "rgba(255,255,255,0.18)", boxShadow: seal === null ? "0 0 0 2px rgba(255,255,255,0.25)" : "none", background: "rgba(255,255,255,0.05)" }}
                >
                  {l("Yok", "None", "None", "None", "—", "None")}
                </button>
                {availableSeals(accountLevel, cosmeticGrants).map((s) => {
                  const selected = seal === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSeal(s.key)}
                      aria-pressed={selected}
                      aria-label={l(s.label.tr, s.label.en, s.label.en, s.label.en, s.label.en, s.label.en)}
                      className="grid h-14 w-14 place-items-center rounded-full border"
                      style={{ borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.18)", boxShadow: selected ? "0 0 0 2px rgba(255,255,255,0.25)" : "none", background: "rgba(255,255,255,0.05)" }}
                    >
                      <RewardArt name={rewardArtFor(s.glyph, "seal")} tint={s.dark} size={40} />
                    </button>
                  );
                })}
              </div>
            </div>
          </ThemeCard>
        )}

        <div className="space-y-3">
          {pageUtilityRows.map((row) => (
            <ThemeCard
              key={row.key}
              accountLevel={accountLevel}
              className="rounded-[20px] border-white/12"
              style={{ borderColor: "rgba(255,255,255,0.10)" }}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenUtilityPanel((current) => (current === row.key ? null : row.key))
                }
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
                aria-expanded={openUtilityPanel === row.key}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  {row.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-white">{row.title}</span>
                  <span className="mt-0.5 block text-[13px] text-white/58">{row.description}</span>
                </span>
                <ChevronRight
                  className={`h-5 w-5 shrink-0 text-white/44 transition-transform duration-200 ${
                    openUtilityPanel === row.key ? "rotate-90" : ""
                  }`}
                />
              </button>
              {openUtilityPanel === row.key ? (
                <div className="border-t border-white/8 px-4 pb-4 pt-1">
                  {row.key === "wallet" ? (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[#f5a15d]" />
                        <h3 className="text-sm font-semibold text-white">
                          {l("Cüzdan bağlantısı", "Wallet connection", "Подключение кошелька", "การเชื่อมต่อกระเป๋า", "Conexión de billetera", "钱包连接")}
                        </h3>
                      </div>
                      <p className="text-sm leading-6 text-white/62">
                        {l(
                          "Solana cüzdanını burada bağlayabilirsin. Artık anlamsız başka bir sayfaya göndermiyor.",
                          "You can connect your Solana wallet here. It no longer sends you to an unrelated page.",
                          "Здесь можно подключить Solana-кошелек. Больше не будет перехода на нерелевантную страницу.",
                          "คุณสามารถเชื่อมต่อกระเป๋า Solana ได้ที่นี่ และจะไม่พาไปหน้าอื่นที่ไม่เกี่ยวข้องอีก",
                          "Puedes conectar tu billetera de Solana aquí. Ya no te enviará a una página irrelevante.",
                          "你可以在这里连接 Solana 钱包，不会再跳转到无关页面。",
                        )}
                      </p>
                      <WalletConnectButton />
                    </div>
                  ) : null}
                  {row.key === "referrals" ? (
                    <div className="space-y-4 pt-3">
                      <ReferralShareCard accountLevel={accountLevel} />
                    </div>
                  ) : null}
                  {row.key === "security" ? (
                    <div className="space-y-4 pt-3">
                      <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#74d0ff]/20 bg-[#74d0ff]/8">
                            <Shield className="h-4 w-4 text-[#74d0ff]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">
                              {emailVerified
                                ? l("E-posta doğrulandı", "Email verified", "Почта подтверждена", "อีเมลได้รับการยืนยันแล้ว", "Correo verificado", "邮箱已验证")
                                : l("E-posta doğrulaması gerekli", "Email verification required", "Требуется подтверждение почты", "ต้องยืนยันอีเมล", "Se requiere verificación de correo", "需要验证邮箱")}
                            </p>
                            <p className="mt-1 text-[13px] leading-6 text-white/62">
                              {emailVerified
                                ? l(
                                    "Şifreni bu panelden güncelleyebilirsin.",
                                    "You can update your password in this panel.",
                                    "Пароль можно обновить в этой панели.",
                                    "อัปเดตรหัสผ่านได้ในแผงนี้",
                                    "Puedes actualizar tu contraseña en este panel.",
                                    "你可以在此面板中更新密码。",
                                  )
                                : l(
                                    "Güvenlik akışını tamamlamak için e-posta adresini doğrulaman gerekiyor.",
                                    "Verify your email address to unlock the full security flow.",
                                    "Подтвердите адрес электронной почты, чтобы открыть полный сценарий безопасности.",
                                    "ยืนยันอีเมลเพื่อใช้งานความปลอดภัยทั้งหมด",
                                    "Verifica tu correo para activar el flujo completo de seguridad.",
                                    "请先验证邮箱以启用完整安全流程。",
                                  )}
                            </p>
                          </div>
                        </div>
                        {!emailVerified ? (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resendVerificationEmail}
                              disabled={emailHasUnsavedChanges || isResendingVerification}
                              className="h-11 rounded-[14px] border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                            >
                              {isResendingVerification ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="mr-2 h-4 w-4" />
                              )}
                              {locale === "tr" ? "Tekrar doğrulama maili gönder" : "Resend verification email"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => router.push("/app/verify-email")}
                              className="h-11 rounded-[14px] text-white/74 hover:bg-white/[0.05] hover:text-white"
                            >
                              {locale === "tr" ? "Doğrulama ekranına git" : "Go to verification screen"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-3 rounded-[16px] border border-white/10 bg-white/[0.025] p-4">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-[#ffc19a]" />
                          <p className="text-sm font-semibold text-white">
                            {l("Şifre değiştir", "Change password", "Сменить пароль", "เปลี่ยนรหัสผ่าน", "Cambiar contraseña", "修改密码")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-page-current-password" className="text-sm text-white/78">
                            {l("Mevcut şifre", "Current password", "Текущий пароль", "รหัสผ่านปัจจุบัน", "Contraseña actual", "当前密码")}
                          </Label>
                          <Input
                            id="profile-page-current-password"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            className="h-12 rounded-[14px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-page-new-password" className="text-sm text-white/78">
                            {l("Yeni şifre", "New password", "Новый пароль", "รหัสผ่านใหม่", "Nueva contraseña", "新密码")}
                          </Label>
                          <Input
                            id="profile-page-new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className="h-12 rounded-[14px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                          />
                          <p className="text-xs leading-5 text-white/48">
                            {l("En az 8 karakter kullan.", "Use at least 8 characters.", "Используй минимум 8 символов.", "ใช้อย่างน้อย 8 ตัวอักษร", "Usa al menos 8 caracteres.", "至少使用 8 个字符。")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-page-confirm-password" className="text-sm text-white/78">
                            {l("Yeni şifre tekrar", "Confirm new password", "Подтверди новый пароль", "ยืนยันรหัสผ่านใหม่", "Confirmar nueva contraseña", "确认新密码")}
                          </Label>
                          <Input
                            id="profile-page-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="h-12 rounded-[14px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-[14px] border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                          disabled={isChangingPassword}
                          onClick={changePassword}
                        >
                          {isChangingPassword ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="mr-2 h-4 w-4" />
                          )}
                          {l("Şifreyi güncelle", "Update password", "Обновить пароль", "อัปเดตรหัสผ่าน", "Actualizar contraseña", "更新密码")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </ThemeCard>
          ))}
        </div>

        <ProfileRecentReceipts accountLevel={accountLevel} locale={locale} numLocale={numLocale} />

        <Button
          variant="outline"
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          disabled={isLoggingOut}
          onClick={logout}
        >
          {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          {t("topbar.logout")}
        </Button>

        <div
          className="sticky bottom-20 z-20 rounded-[24px] px-1 pt-4 backdrop-blur lg:bottom-6"
          style={{
            background:
              "var(--profile-save-backdrop, linear-gradient(180deg, rgba(10,11,16,0.0), rgba(10,11,16,0.88) 44%, rgba(10,11,16,0.96) 100%))",
          }}
        >
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="h-16 w-full rounded-[18px] border-0 bg-[linear-gradient(135deg,#ff7a1f_0%,#ff6b62_52%,#f43492_100%)] text-[17px] font-semibold text-[#fff] shadow-[0_14px_30px_rgba(255,106,119,0.26)] hover:opacity-95"
          >
            {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
            {locale === "tr" ? "Değişiklikleri kaydet" : "Save changes"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={variant === "modal" ? "space-y-5" : "space-y-6"}>
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <ThemeCard accountLevel={accountLevel} className="overflow-hidden">
            <div
              className="p-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(22,27,39,0.96) 35%, rgba(15,17,23,0.98) 100%)",
              }}
            >
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadAvatar(file);
                }}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>
                    {variant === "modal"
                      ? l("Profil masası", "Profile desk", "Профильный стол", "โต๊ะโปรไฟล์", "Panel de perfil", "个人资料面板")
                      : l("Profil çalışma alanı", "Profile workspace", "Рабочее пространство профиля", "พื้นที่ทำงานโปรไฟล์", "Espacio de perfil", "个人资料工作区")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" style={{ color: "var(--app-text-primary)" }}>
                    {displayName || profile?.username || l("Kullanıcı", "User", "Пользователь", "ผู้ใช้", "Usuario", "用户")}
                  </h2>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--app-text-secondary)" }}>
                    {l(
                      "Kimlik, kişisel bilgi, lokasyon ve cüzdan alanlarını tek yerden düzenle.",
                      "Edit identity, personal info, location, and wallet details from one place.",
                      "Редактируйте личность, личные данные, локацию и кошелёк в одном месте.",
                      "แก้ไขตัวตน ข้อมูลส่วนตัว ตำแหน่ง และกระเป๋าเงินจากที่เดียว",
                      "Edita identidad, datos personales, ubicación y billetera desde un solo lugar.",
                      "在一个地方编辑身份、个人信息、位置和钱包。",
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-white/10 bg-white/[0.03] text-[var(--app-text-primary)] hover:bg-white/[0.06]"
                      disabled={isUploadingAvatar || isRemovingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                      {avatarUrl
                        ? l("Fotoğrafı değiştir", "Change photo", "Изменить фото", "เปลี่ยนรูป", "Cambiar foto", "更换头像")
                        : l("Profil fotoğrafı ekle", "Add profile photo", "Добавить фото профиля", "เพิ่มรูปโปรไฟล์", "Agregar foto de perfil", "添加头像")}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 border-white/10 bg-white/[0.03] text-[var(--app-text-secondary)] hover:bg-white/[0.06]"
                        disabled={isUploadingAvatar || isRemovingAvatar}
                        onClick={removeAvatar}
                      >
                        {isRemovingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {l("Kaldır", "Remove", "Удалить", "ลบ", "Eliminar", "移除")}
                      </Button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-lg font-semibold transition-opacity hover:opacity-90"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--app-primary)",
                  }}
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label={l("Profil fotoğrafı seç", "Select profile photo", "Выбрать фото профиля", "เลือกรูปโปรไฟล์", "Seleccionar foto de perfil", "选择头像")}
                >
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-tl-lg bg-black/70">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border p-3"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--app-text-muted)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs" style={{ color: "var(--app-text-secondary)" }}>
                  <span>{l("Seviye ilerlemesi", "Level progress", "Прогресс уровня", "ความคืบหน้าระดับ", "Progreso de nivel", "等级进度")}</span>
                  <span>{xpInLevel} / {xpRange} XP</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, var(--app-primary), #f0d080)" }}
                  />
                </div>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard accountLevel={accountLevel} className="p-5">
            <WalletPanel locale={locale} />
          </ThemeCard>

          <ThemeCard accountLevel={accountLevel} className="p-5">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
                <h3 className={sectionTitleClass} style={{ color: "var(--app-text-primary)" }}>
                  {l("Oturum ve güvenlik", "Session and security", "Сессия и безопасность", "เซสชันและความปลอดภัย", "Sesión y seguridad", "会话与安全")}
                </h3>
              </div>
              <p className="text-sm leading-6" style={{ color: "var(--app-text-secondary)" }}>
                {locale === "tr"
                  ? "Şifreni güncelle veya bu oturumdan güvenli biçimde çıkış yap."
                  : "Update your password or safely sign out from this session."}
              </p>

              <div className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
                    {l("Şifre değiştir", "Change password", "Сменить пароль", "เปลี่ยนรหัสผ่าน", "Cambiar contraseña", "修改密码")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="profile-current-password">{l("Mevcut şifre", "Current password", "Текущий пароль", "รหัสผ่านปัจจุบัน", "Contraseña actual", "当前密码")}</Label>
                    <Input
                      id="profile-current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-new-password">{l("Yeni şifre", "New password", "Новый пароль", "รหัสผ่านใหม่", "Nueva contraseña", "新密码")}</Label>
                    <Input
                      id="profile-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={fieldClass}
                    />
                    <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
                      {l("En az 8 karakter kullan.", "Use at least 8 characters.", "Используй минимум 8 символов.", "ใช้อย่างน้อย 8 ตัวอักษร", "Usa al menos 8 caracteres.", "至少使用 8 个字符。")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-confirm-password">{l("Yeni şifre tekrar", "Confirm new password", "Подтверди новый пароль", "ยืนยันรหัสผ่านใหม่", "Confirmar nueva contraseña", "确认新密码")}</Label>
                    <Input
                      id="profile-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-[var(--app-border)] bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] hover:bg-white/[0.04]"
                  disabled={isChangingPassword}
                  onClick={changePassword}
                >
                  {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {l("Şifreyi güncelle", "Update password", "Обновить пароль", "อัปเดตรหัสผ่าน", "Actualizar contraseña", "更新密码")}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                disabled={isLoggingOut}
                onClick={logout}
              >
                {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {t("topbar.logout")}
              </Button>
            </div>
          </ThemeCard>
        </div>

        <div className="space-y-5">
          <ThemeCard accountLevel={accountLevel} className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <UserRound className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
              <h3 className={sectionTitleClass} style={{ color: "var(--app-text-primary)" }}>
                {l("Kimlik bilgileri", "Identity details", "Данные профиля", "ข้อมูลตัวตน", "Datos de identidad", "身份信息")}
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="profile-account-email">{t("settings.email")}</Label>
                  {!emailLoading && (
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md"
                      style={{
                        color: emailHasUnsavedChanges
                          ? "var(--app-text-primary)"
                          : emailVerified
                            ? "var(--app-text-secondary)"
                            : "var(--app-text-muted)",
                        background: emailHasUnsavedChanges
                          ? "rgb(59 130 246 / 0.15)"
                          : emailVerified
                            ? "rgb(34 197 94 / 0.12)"
                            : "rgb(234 179 8 / 0.12)",
                      }}
                    >
                      {emailHasUnsavedChanges
                        ? t("settings.emailUnsaved")
                        : emailVerified
                          ? t("settings.emailVerified")
                          : t("settings.emailUnverified")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                  {t("settings.emailSaveHint")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input
                    id="profile-account-email"
                    type="email"
                    autoComplete="email"
                    value={emailLoading ? "" : emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t("settings.emailPlaceholder")}
                    className={fieldClass}
                    disabled={emailLoading}
                    aria-busy={emailLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-[var(--app-border)] bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] hover:bg-white/[0.04] sm:w-auto w-full"
                    disabled={emailLoading || isSavingEmail || !emailHasUnsavedChanges}
                    onClick={saveEmail}
                  >
                    {isSavingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {isSavingEmail ? t("settings.saving") : t("settings.saveEmail")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-display-name">{t("settings.displayName")}</Label>
                <Input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-gender">{t("settings.gender")}</Label>
                <Select value={gender || "unset"} onValueChange={(value) => setGender(value === "unset" ? "" : value)}>
                  <SelectTrigger id="profile-gender" className={fieldClass}>
                    <SelectValue placeholder={t("settings.genderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">{l("Belirtmek istemiyorum", "Prefer not to say", "Предпочитаю не указывать", "ไม่ต้องการระบุ", "Prefiero no decirlo", "不想透露")}</SelectItem>
                    <SelectItem value="male">{t("settings.gender.male")}</SelectItem>
                    <SelectItem value="female">{t("settings.gender.female")}</SelectItem>
                    <SelectItem value="non-binary">{t("settings.gender.nonBinary")}</SelectItem>
                    <SelectItem value="other">{t("settings.gender.other")}</SelectItem>
                    <SelectItem value="prefer-not-to-say">{t("settings.gender.preferNotToSay")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-birthdate">{t("settings.birthDate")}</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--app-text-muted)" }} />
                  <Input
                    id="profile-birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`pl-10 ${fieldClass}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-occupation">{t("settings.occupation")}</Label>
                <Input
                  id="profile-occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder={t("settings.occupationPlaceholder")}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-income">{t("settings.monthlyIncome")}</Label>
                <IncomeBandSelect
                  id="profile-income"
                  value={incomeBand}
                  onValueChange={setIncomeBand}
                  countryCode={accountCountry}
                  locale={locale}
                  className={fieldClass}
                  placeholder={t("settings.monthlyIncomePlaceholder")}
                />
              </div>
            </div>
          </ThemeCard>

          <ThemeCard accountLevel={accountLevel} className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
              <h3 className={sectionTitleClass} style={{ color: "var(--app-text-primary)" }}>
                {l("Lokasyon ve bağlantılar", "Location and links", "Локация и ссылки", "ตำแหน่งและลิงก์", "Ubicación y enlaces", "位置与链接")}
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-city">{l("Şehir", "City", "Город", "เมือง", "Ciudad", "城市")}</Label>
                <Input
                  id="profile-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={l("Istanbul", "Bangkok", "Москва", "กรุงเทพฯ", "Madrid", "上海")}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-country">{l("Ülke", "Country", "Страна", "ประเทศ", "País", "国家")}</Label>
                <div className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4">
                  <span className={accountCountry ? "" : "opacity-50"} style={{ color: "var(--app-text)" }}>
                    {accountCountry
                      ? isOtherCountry(accountCountry)
                        ? l("Diğer", "Other", "Другое", "อื่นๆ", "Otro", "其他")
                        : getCountryByCode(accountCountry)?.name ?? accountCountry
                      : l("Seçilmedi", "Not selected", "Не выбрано", "ยังไม่เลือก", "No seleccionado", "未选择")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--app-text-muted)" }}>
                    <Lock className="h-3.5 w-3.5" />
                    {l("Sabit", "Locked", "Зафиксировано", "ล็อก", "Fijo", "已锁定")}
                  </span>
                </div>
                <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
                  {l("Kayıt sırasında seçilen ülke değiştirilemez.", "The country chosen at signup can't be changed.", "Страну, выбранную при регистрации, изменить нельзя.", "ประเทศที่เลือกตอนสมัครไม่สามารถเปลี่ยนได้", "El país elegido al registrarte no se puede cambiar.", "注册时选择的国家无法更改。")}
                </p>
                <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
                  {accountCountry
                    ? locale === "tr"
                      ? `Gelir karşılıkları ${getCountryByCode(accountCountry)?.currency ?? "USD"} para birimine göre hesaplanır.`
                      : `Income equivalents are shown in ${getCountryByCode(accountCountry)?.currency ?? "USD"}.`
                    : locale === "tr"
                      ? "Yerel para birimi karşılıklarını görmek için ülke seç."
                      : "Select a country to see local currency equivalents."}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-website">{l("Web sitesi / sosyal link", "Website / social link", "Сайт / соцссылка", "เว็บไซต์ / โซเชียลลิงก์", "Sitio web / enlace social", "网站 / 社媒链接")}</Label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--app-text-muted)" }} />
                  <Input
                    id="profile-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                    className={`pl-10 ${fieldClass}`}
                  />
                </div>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard accountLevel={accountLevel} className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <Coins className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
              <h3 className={sectionTitleClass} style={{ color: "var(--app-text-primary)" }}>
                {l("Hakkımda", "About", "Обо мне", "เกี่ยวกับฉัน", "Sobre mí", "关于我")}
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">{l("Kısa açıklama", "Short bio", "Кратко о себе", "แนะนำตัวสั้นๆ", "Biografía corta", "简短介绍")}</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  locale === "tr"
                    ? "Ekonomik alışkanlıkların, hedeflerin veya kendinle ilgili kısa bir not yaz."
                    : "Write a short note about your economic habits, goals, or yourself."
                }
                className={`min-h-[140px] ${fieldClass}`}
              />
            </div>
          </ThemeCard>

          <ThemeCard accountLevel={accountLevel} className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
              <h3 className={sectionTitleClass} style={{ color: "var(--app-text-primary)" }}>
                {l("Davet sistemi", "Referrals", "Рефералы", "ระบบชวนเพื่อน", "Referidos", "邀请系统")}
              </h3>
            </div>
            <div className="space-y-5">
              <ReferralShareCard accountLevel={accountLevel} />
            </div>
          </ThemeCard>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {variant === "modal" && (
              <Button
                type="button"
                variant="outline"
                className="border-[var(--app-border)] bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] hover:bg-white/[0.04]"
                onClick={() => {
                  router.push("/app/profile");
                  onDone?.();
                }}
              >
                {l("Tam profil sayfasını aç", "Open full profile page", "Открыть полную страницу профиля", "เปิดหน้าโปรไฟล์เต็ม", "Abrir perfil completo", "打开完整资料页")}
              </Button>
            )}
            <Button onClick={saveProfile} disabled={isSaving} className="min-w-[180px]">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("settings.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

