"use client"

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { Send, Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

export default function SupportPage() {
  const { locale } = useLocale();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const supportContent: Record<string, any> = {
    en: {
      title: "Support",
      subtitle: "We're here to help! Get in touch with us.",
      formTitle: "Contact Us",
      nameLabel: "Your Name",
      emailLabel: "Your Email",
      subjectLabel: "Subject",
      messageLabel: "Message",
      submitButton: "Send Message",
      submitting: "Sending...",
      successTitle: "Message Sent!",
      successMessage: "Thank you for contacting us. We'll get back to you soon!",
      errorTitle: "Error",
      errorMessage: "Something went wrong. Please try again.",
      getHelp: "Get Help",
      faqTitle: "FAQ",
      faqDescription: "Check out our frequently asked questions for quick answers.",
      faqLink: "Visit FAQ →",
      contactTitle: "Contact Us",
      contactDescription: "Send us an email or reach out through our social media channels.",
      resources: "Resources",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
    },
    tr: {
      title: "Destek",
      subtitle: "Yardımcı olmak için buradayız! Bizimle iletişime geçin.",
      formTitle: "Bize Ulaşın",
      nameLabel: "Adınız",
      emailLabel: "E-posta Adresiniz",
      subjectLabel: "Konu",
      messageLabel: "Mesajınız",
      submitButton: "Mesaj Gönder",
      submitting: "Gönderiliyor...",
      successTitle: "Mesaj Gönderildi!",
      successMessage: "Bizimle iletişime geçtiğiniz için teşekkürler. En kısa sürede size dönüş yapacağız!",
      errorTitle: "Hata",
      errorMessage: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
      getHelp: "Yardım Al",
      faqTitle: "SSS",
      faqDescription: "Hızlı cevaplar için sıkça sorulan sorularımıza göz atın.",
      faqLink: "SSS'yi Ziyaret Et →",
      contactTitle: "Bize Ulaşın",
      contactDescription: "Bize e-posta gönderin veya sosyal medya kanallarımızdan ulaşın.",
      resources: "Kaynaklar",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "Kullanım Koşulları",
      privacy: "Gizlilik Politikası",
    },
    th: {
      title: "สนับสนุน",
      subtitle: "เราพร้อมช่วยเหลือ! ติดต่อเราได้เลย",
      formTitle: "ติดต่อเรา",
      nameLabel: "ชื่อของคุณ",
      emailLabel: "อีเมลของคุณ",
      subjectLabel: "หัวข้อ",
      messageLabel: "ข้อความ",
      submitButton: "ส่งข้อความ",
      submitting: "กำลังส่ง...",
      successTitle: "ส่งข้อความสำเร็จ!",
      successMessage: "ขอบคุณที่ติดต่อเรา เราจะตอบกลับโดยเร็วที่สุด!",
      errorTitle: "เกิดข้อผิดพลาด",
      errorMessage: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      getHelp: "รับความช่วยเหลือ",
      faqTitle: "คำถามที่พบบ่อย",
      faqDescription: "ดูคำถามที่พบบ่อยสำหรับคำตอบด่วน",
      faqLink: "ไปที่ FAQ →",
      contactTitle: "ติดต่อเรา",
      contactDescription: "ส่งอีเมลหรือติดต่อเราผ่านช่องทางโซเชียลมีเดีย",
      resources: "ทรัพยากร",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "ข้อกำหนดและเงื่อนไข",
      privacy: "นโยบายความเป็นส่วนตัว",
    },
    ru: {
      title: "Поддержка",
      subtitle: "Мы здесь, чтобы помочь! Свяжитесь с нами.",
      formTitle: "Связаться с нами",
      nameLabel: "Ваше имя",
      emailLabel: "Ваш email",
      subjectLabel: "Тема",
      messageLabel: "Сообщение",
      submitButton: "Отправить сообщение",
      submitting: "Отправка...",
      successTitle: "Сообщение отправлено!",
      successMessage: "Спасибо за обращение. Мы скоро ответим!",
      errorTitle: "Ошибка",
      errorMessage: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
      getHelp: "Получить помощь",
      faqTitle: "FAQ",
      faqDescription: "Посмотрите часто задаваемые вопросы для быстрых ответов.",
      faqLink: "Посетить FAQ →",
      contactTitle: "Связаться с нами",
      contactDescription: "Напишите нам на email или свяжитесь через социальные сети.",
      resources: "Ресурсы",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "Условия использования",
      privacy: "Политика конфиденциальности",
    },
    es: {
      title: "Soporte",
      subtitle: "¡Estamos aquí para ayudar! Ponte en contacto con nosotros.",
      formTitle: "Contáctanos",
      nameLabel: "Tu nombre",
      emailLabel: "Tu email",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      submitButton: "Enviar mensaje",
      submitting: "Enviando...",
      successTitle: "¡Mensaje enviado!",
      successMessage: "Gracias por contactarnos. ¡Te responderemos pronto!",
      errorTitle: "Error",
      errorMessage: "Algo salió mal. Por favor, inténtalo de nuevo.",
      getHelp: "Obtener ayuda",
      faqTitle: "FAQ",
      faqDescription: "Consulta nuestras preguntas frecuentes para respuestas rápidas.",
      faqLink: "Visitar FAQ →",
      contactTitle: "Contáctanos",
      contactDescription: "Envíanos un email o contáctanos a través de nuestras redes sociales.",
      resources: "Recursos",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "Términos y Condiciones",
      privacy: "Política de Privacidad",
    },
    zh: {
      title: "支持",
      subtitle: "我们随时为您提供帮助！联系我们。",
      formTitle: "联系我们",
      nameLabel: "您的姓名",
      emailLabel: "您的邮箱",
      subjectLabel: "主题",
      messageLabel: "消息",
      submitButton: "发送消息",
      submitting: "发送中...",
      successTitle: "消息已发送！",
      successMessage: "感谢您联系我们。我们会尽快回复您！",
      errorTitle: "错误",
      errorMessage: "出了点问题。请重试。",
      getHelp: "获取帮助",
      faqTitle: "常见问题",
      faqDescription: "查看我们的常见问题以获取快速答案。",
      faqLink: "访问常见问题 →",
      contactTitle: "联系我们",
      contactDescription: "给我们发邮件或通过社交媒体联系我们。",
      resources: "资源",
      funPaper: "Fun Paper",
      whitepaper: "Vision Paper",
      terms: "条款和条件",
      privacy: "隐私政策",
    },
  };

  const content = supportContent[locale] || supportContent.en;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitStatus(null);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || content.errorMessage);
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      setSubmitStatus("error");
      setErrorMessage(error.message || content.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="relative inline-block mb-4 sm:mb-6">
              {/* Static glow — was animate-pulse before; removed for perf consistency with hero */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-pink-500 to-orange-500 rounded-full blur-2xl opacity-30"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 via-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-white/10 shadow-2xl">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent break-words">
              {content.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-2">
              {content.subtitle}
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-10 lg:p-12 mb-8 sm:mb-12 border border-white/10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-white flex items-center gap-3 break-words">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              {content.formTitle}
            </h2>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-400 mb-1">{content.successTitle}</h3>
                  <p className="text-green-300">{content.successMessage}</p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-400 mb-1">{content.errorTitle}</h3>
                  <p className="text-red-300">{errorMessage || content.errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
                    {content.nameLabel}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-500"
                    placeholder={content.nameLabel}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                    {content.emailLabel}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-500"
                    placeholder={content.emailLabel}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-300 mb-2">
                  {content.subjectLabel}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-500"
                  placeholder={content.subjectLabel}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">
                  {content.messageLabel}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none placeholder:text-gray-500"
                  placeholder={content.messageLabel}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-pink-500 to-orange-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {content.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {content.submitButton}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                {content.faqTitle}
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">{content.faqDescription}</p>
              <Link href="/faq/" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                {content.faqLink}
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                {content.contactTitle}
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">{content.contactDescription}</p>
              <a
                href="https://twitter.com/yumohq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                Twitter →
              </a>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{content.resources}</h2>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/funpaper/" className="text-primary hover:underline">
                  {content.funPaper}
                </Link>
              </li>
              <li>
                <a
                  href={`/vision/${locale || 'tr'}`}
                  className="text-primary hover:underline"
                >
                  {content.whitepaper}
                </a>
              </li>
              <li>
                <Link href="/terms/" className="text-primary hover:underline">
                  {content.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy/" className="text-primary hover:underline">
                  {content.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
