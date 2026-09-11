import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Megaphone,
  Ban,
  UserX,
  Scale,
  RefreshCw,
} from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Composants de mise en page
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
      <View className="flex-row items-center gap-3 mb-4">
        {icon}
        <Text className="text-txt font-bold text-lg flex-1">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ label, value }: { label?: string; value: string }) {
  return (
    <Text className="text-txt-60 text-sm mb-1.5">
      {'• '}
      {label ? <Text className="text-txt font-semibold">{label} </Text> : null}
      {value}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Écran CGU / CLUF
// ─────────────────────────────────────────────────────────────────────────────

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Barre de navigation */}
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
          CGU & Contrat de Licence
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 60 }}>

          {/* En-tête */}
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
              <FileText size={32} color={palette.primary} />
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
              Conditions Générales d&apos;Utilisation
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.serif,
                fontStyle: 'italic',
                fontSize: 13,
                color: palette.inkSoft,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Version 1.0 — Entrée en vigueur : 10 septembre 2026
            </Text>
            <Text style={{ fontSize: 11, color: palette.inkSoft, textAlign: 'center' }}>
              CGU · CLUF (EULA) · Droit de la consommation numérique (UE, CCPA, OHADA)
            </Text>
          </View>

          {/* 1 — Acceptation */}
          <Section icon={<FileText size={20} color={palette.primary} />} title="1. Acceptation des conditions">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              En téléchargeant, installant ou utilisant l&apos;application Xalaat (développée
              par <Text className="text-txt font-semibold">MouhaDev</Text>), vous acceptez
              sans réserve les présentes Conditions Générales d&apos;Utilisation et le
              Contrat de Licence Utilisateur Final (CLUF).
            </Text>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Si vous n&apos;acceptez pas ces conditions dans leur intégralité, vous devez
              désinstaller immédiatement l&apos;Application et cesser tout usage.
            </Text>
          </Section>

          {/* 2 — Éligibilité */}
          <Section icon={<UserX size={20} color={palette.gold} />} title="2. Éligibilité et âge minimum">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              L&apos;accès est réservé aux personnes âgées d&apos;au moins{' '}
              <Text className="text-txt font-bold">13 ans</Text>.
            </Text>
            <Bullet
              label="UE (certains États) :"
              value="le consentement parental est requis entre 13 et 15 ans (majorité numérique à 16 ans en Allemagne, Pays-Bas, etc.)."
            />
            <Bullet
              label="Moins de 13 ans :"
              value="tout compte détecté sera immédiatement supprimé et ses données définitivement purgées."
            />
            <Text className="text-txt-60 text-sm leading-relaxed mt-3">
              En s&apos;inscrivant, l&apos;utilisateur déclare sur l&apos;honneur remplir ces conditions.
            </Text>
          </Section>

          {/* 3 — Licence */}
          <Section icon={<ShieldCheck size={20} color={palette.good} />} title="3. Licence d'utilisation">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Xalaat vous accorde une licence{' '}
              <Text className="text-txt font-semibold">
                personnelle, non exclusive, non transférable et révocable
              </Text>{' '}
              pour utiliser l&apos;Application sur vos appareils, à des fins strictement
              personnelles et non commerciales.
            </Text>
            <Text className="text-txt font-semibold text-sm mb-2">Sont expressément interdits :</Text>
            <Bullet value="Copier, modifier, adapter ou créer des œuvres dérivées de l'Application." />
            <Bullet value="Procéder à l'ingénierie inverse, décompiler ou désassembler le code." />
            <Bullet value="Distribuer, vendre, sous-licencier ou transférer l'Application." />
            <Bullet value="Utiliser l'Application à des fins commerciales sans autorisation écrite." />
            <Bullet value="Contourner toute mesure de protection technique." />
            <Bullet value="Accéder aux systèmes par des moyens non autorisés (bots, scraping, injection)." />
            <View className="mt-4 p-3 rounded-2xl bg-bg border border-line">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">Propriété intellectuelle : </Text>
                le code source, les graphismes, les questions, les algorithmes et les marques
                sont la propriété exclusive de MouhaDev ou de ses concédants. Aucun droit de
                propriété intellectuelle n&apos;est transféré à l&apos;utilisateur.
              </Text>
            </View>
          </Section>

          {/* 4 — Description des services */}
          <Section icon={<FileText size={20} color={palette.primary} />} title="4. Services proposés">
            <Bullet label="Sessions multijoueur :" value="quiz en temps réel avec buzzer." />
            <Bullet label="Mode Solo / Sprint :" value="sessions individuelles avec classement." />
            <Bullet label="Défi du Jour :" value="une question quotidienne générée par IA." />
            <Bullet label="Classements & progression :" value="scores, rangs et statistiques." />
            <Bullet label="Publicités :" value="affichage de publicités de partenaires." />
            <Text className="text-txt-60 text-xs leading-relaxed mt-3">
              L&apos;Éditeur s&apos;efforce de maintenir le service 24h/24, 7j/7, mais ne
              saurait être tenu responsable d&apos;interruptions dues à la maintenance, à des
              pannes ou à des événements de force majeure.
            </Text>
          </Section>

          {/* 5 — Contenu IA */}
          <Section icon={<Bot size={20} color={palette.gold} />} title="5. Contenu généré par IA">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Certaines questions sont générées dynamiquement par des systèmes
              d&apos;intelligence artificielle. L&apos;Éditeur applique des filtres de
              modération mais ne peut garantir l&apos;exactitude factuelle absolue de ce
              contenu.
            </Text>
            <View className="p-3 rounded-2xl bg-bg border border-line mb-3">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">⚠ Limitation de responsabilité : </Text>
                le contenu généré par IA est fourni à des fins de{' '}
                <Text className="text-txt font-semibold">divertissement uniquement</Text>. Il
                ne constitue pas une information officielle, médicale, juridique, financière ou
                scientifique. L&apos;Éditeur décline toute responsabilité pour les inexactitudes.
              </Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Tout utilisateur peut signaler une question inexacte ou inappropriée
              directement depuis l&apos;interface. Toute question signalée est immédiatement
              examinée et, si nécessaire, désactivée.
            </Text>
          </Section>

          {/* 6 — Publicités */}
          <Section icon={<Megaphone size={20} color={palette.primary} />} title="6. Publicités">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              L&apos;Application peut afficher des publicités de partenaires commerciaux.
              Ces publicités sont clairement identifiées et peuvent être adaptées à votre
              profil d&apos;utilisation avec votre consentement préalable.
            </Text>
            <Text className="text-txt-60 text-sm leading-relaxed">
              L&apos;Éditeur n&apos;est pas responsable du contenu des publicités diffusées
              par des régies tierces et n&apos;endosse pas les produits ou services annoncés.
              Vous pouvez gérer vos préférences publicitaires dans les paramètres de
              l&apos;Application.
            </Text>
          </Section>

          {/* 7 — Règles de conduite */}
          <Section icon={<Ban size={20} color={palette.bad} />} title="7. Règles de conduite">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              L&apos;utilisateur s&apos;engage à ne pas :
            </Text>
            <Bullet value="Adopter un pseudonyme ou avatar offensant, discriminatoire ou portant atteinte aux droits d'un tiers." />
            <Bullet value="Harceler, menacer ou insulter d'autres utilisateurs." />
            <Bullet value="Tricher, utiliser des bots ou scripts automatisés." />
            <Bullet value="Usurper l'identité d'un tiers ou d'un membre de l'équipe Xalaat." />
            <Bullet value="Diffuser du contenu illicite ou contraire aux bonnes mœurs." />
            <Bullet value="Tenter de pirater ou de perturber les serveurs." />
            <View className="mt-4 p-3 rounded-2xl bg-bg border border-line">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">Sanctions : </Text>
                avertissement, suspension temporaire ou suppression définitive du compte,
                sans préavis ni indemnité, selon la gravité du manquement.
              </Text>
            </View>
          </Section>

          {/* 8 — Compte */}
          <Section icon={<UserX size={20} color={palette.indigo} />} title="8. Compte utilisateur">
            <Bullet
              label="Responsabilité :"
              value="l'utilisateur est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte."
            />
            <Bullet
              label="Suppression :"
              value="possible à tout moment depuis les Paramètres ou en contactant le support. Toutes les données sont purgées définitivement sous 30 jours."
            />
            <Bullet
              label="Résiliation par l'Éditeur :"
              value="tout compte peut être suspendu ou résilié sans préavis en cas de violation des présentes conditions."
            />
          </Section>

          {/* 9 — Limitation de responsabilité */}
          <Section icon={<AlertTriangle size={20} color={palette.gold} />} title="9. Limitation de responsabilité">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Dans les limites permises par le droit applicable :
            </Text>
            <Bullet value="L'Application est fournie « en l'état » (as is), sans garantie d'adéquation à un usage particulier." />
            <Bullet value="L'Éditeur n'est pas responsable des dommages indirects, consécutifs ou punitifs." />
            <Bullet value="La responsabilité totale de l'Éditeur ne peut excéder le montant payé par l'utilisateur au cours des 12 derniers mois, ou 100 € si aucun paiement n'a été effectué." />
            <Text className="text-txt-60 text-xs leading-relaxed mt-3">
              Ces limitations ne s&apos;appliquent pas aux dommages causés par la faute
              intentionnelle ou la négligence grave de l&apos;Éditeur, ni aux droits
              impératifs protégés par votre loi nationale.
            </Text>
          </Section>

          {/* 10 — Loi applicable */}
          <Section icon={<Scale size={20} color={palette.primary} />} title="10. Loi applicable & litiges">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Les présentes conditions sont soumises au droit{' '}
              <Text className="text-txt font-semibold">sénégalais</Text> à titre subsidiaire,
              sans préjudice des droits impératifs accordés aux consommateurs par leur loi
              nationale.
            </Text>
            <Bullet
              label="Utilisateurs UE :"
              value="bénéficient des protections Directive 2011/83/UE et Règlement DSA 2022/2065."
            />
            <Bullet
              label="Utilisateurs californiens :"
              value="bénéficient des droits CCPA/CPRA."
            />
            <View className="mt-4 p-3 rounded-2xl bg-bg border border-line">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">Règlement des litiges : </Text>
                en cas de litige, une tentative de résolution amiable est obligatoire avant
                toute action judiciaire (délai de 60 jours). Les utilisateurs UE peuvent
                recourir à la plateforme RLL de la Commission européenne.
              </Text>
            </View>
          </Section>

          {/* 11 — Modifications */}
          <Section icon={<RefreshCw size={20} color={palette.good} />} title="11. Modifications des CGU">
            <Text className="text-txt-60 text-sm leading-relaxed">
              L&apos;Éditeur peut modifier ces conditions à tout moment. Toute modification
              substantielle sera notifiée via l&apos;Application ou par email avec un préavis
              minimum de <Text className="text-txt font-semibold">30 jours</Text>. La
              poursuite de l&apos;utilisation après ce délai vaut acceptation des nouvelles
              conditions.
            </Text>
          </Section>

          {/* Pied de page */}
          <View className="p-4 rounded-2xl bg-surface border border-line">
            <Text className="text-txt-60 text-xs leading-relaxed text-center">
              Pour toute question relative aux présentes conditions :{'\n'}
              <Text className="text-accent font-semibold">support@xalaat.app</Text>
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
