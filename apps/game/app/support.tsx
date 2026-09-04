import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle, CheckCircle, Send } from 'lucide-react-native';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { supportApi } from '~/lib/api';
import { useAuthStore } from '~/stores/useAuthStore';

export default function SupportScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      notify.error('Veuillez préciser le sujet de votre message.');
      return;
    }
    if (!message.trim()) {
      notify.error('Veuillez décrire votre problème ou suggestion.');
      return;
    }

    setIsSending(true);
    try {
      await supportApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: email.trim() || undefined,
      });
      setSent(true);
      notify.success('Message envoyé au support !');
    } catch (err: any) {
      const errorCode = err?.response?.data?.error;
      const status = err?.response?.status;
      if (status === 429 || errorCode === 'TOO_MANY_OPEN_TICKETS') {
        notify.error('Tu as déjà plusieurs demandes en cours.');
      } else {
        notifyApiError(err, "Impossible d'envoyer votre message au support.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            lineHeight: 26,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Centre d&apos;aide & Support
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 48 }}>
          {/* Header Badge */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: palette.primary + '1A',
                borderWidth: 1,
                borderColor: palette.primary + '33',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <HelpCircle size={32} color={palette.primary} />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 24,
                lineHeight: 32,
                color: palette.txt,
                textAlign: 'center',
                paddingTop: 2,
                marginBottom: 6,
              }}
            >
              Comment pouvons-nous vous aider ?
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.serif,
                fontStyle: 'italic',
                fontSize: 14,
                color: palette.inkSoft,
                textAlign: 'center',
              }}
            >
              L&apos;équipe Xalaat est disponible pour répondre à vos questions.
            </Text>
          </View>

          {/* FAQ Preview */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <Text className="text-txt font-bold text-lg mb-4">Questions fréquentes</Text>
            <View className="flex-col gap-4">
              <View className="pb-3 border-b border-line">
                <Text className="text-txt font-semibold text-sm mb-1">Comment rejoindre une partie ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Entrez le code à 6 chiffres fourni par l&apos;hôte ou scannez le QR code de la session depuis l&apos;écran d&apos;accueil.
                </Text>
              </View>
              <View className="pb-3 border-b border-line">
                <Text className="text-txt font-semibold text-sm mb-1">Comment fonctionne le buzzer ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Appuyez sur le bouton central dès que vous connaissez la réponse. Le système ordonne les buzzers au millième de seconde. Sur ordinateur, la barre ESPACE déclenche le buzzer.
                </Text>
              </View>
              <View>
                <Text className="text-txt font-semibold text-sm mb-1">Comment signaler une question inexacte ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Cliquez sur l&apos;icône de signalement lors de l&apos;affichage de la question ou contactez le support directement ci-dessous.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Form */}
          <View className="bg-surface rounded-3xl p-6 border border-line">
            <Text className="text-txt font-bold text-lg mb-2">Contactez-nous</Text>
            <Text className="text-txt-60 text-xs mb-5">
              Une réponse vous sera envoyée sous 24 à 48 heures ouvrées.
            </Text>

            {!sent ? (
              <View className="flex-col gap-4">
                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Sujet *</Text>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Ex : Problème de buzzer, Question erronée…"
                    placeholderTextColor={inkAlpha.faint}
                    maxLength={200}
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line"
                  />
                </View>

                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Email de contact (optionnel)</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    placeholderTextColor={inkAlpha.faint}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={255}
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line"
                  />
                </View>

                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Message *</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Décrivez votre problème ou suggestion..."
                    placeholderTextColor={inkAlpha.faint}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={5000}
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line min-h-[100px]"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={isSending}
                  activeOpacity={0.8}
                  className="w-full py-4 rounded-2xl bg-host flex-row items-center justify-center shadow-sm mt-2"
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={palette.primaryInk} />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Send size={18} color={palette.primaryInk} />
                      <Text className="text-primary-ink font-bold text-base">Envoyer le message</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-col items-center text-center py-4">
                <CheckCircle size={36} color={palette.good} />
                <Text className="text-txt font-bold text-lg mt-3 mb-1">Message transmis !</Text>
                <Text className="text-txt-60 text-xs text-center">
                  Nous avons bien reçu votre demande et reviendrons vers vous très prochainement.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
