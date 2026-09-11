import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  Lock,
  Database,
  UserCheck,
  Mail,
  Globe,
  Clock,
  Eye,
  AlertTriangle,
} from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Composants de mise en page réutilisables
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconColor?: string;
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

function Bullet({ label, value }: { label: string; value: string }) {
  return (
    <Text className="text-txt-60 text-sm mb-1.5">
      {'• '}
      <Text className="text-txt font-semibold">{label} </Text>
      {value}
    </Text>
  );
}

function TableRow({
  col1,
  col2,
  col3,
  header,
}: {
  col1: string;
  col2: string;
  col3?: string;
  header?: boolean;
}) {
  const textClass = header ? 'text-txt font-bold text-xs' : 'text-txt-60 text-xs';
  return (
    <View
      className={`flex-row gap-2 py-2 ${header ? 'border-b border-line' : 'border-b border-line/40'}`}
    >
      <Text className={`${textClass} flex-1`}>{col1}</Text>
      <Text className={`${textClass} flex-1`}>{col2}</Text>
      {col3 !== undefined && <Text className={`${textClass} flex-1`}>{col3}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen() {
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
          Politique de Confidentialité
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
              <Shield size={32} color={palette.primary} />
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
              Protection de vos données
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
              Conforme RGPD · CCPA/CPRA · LGPD · Loi sénégalaise 2008-12 · App Store · Google Play
            </Text>
          </View>

          {/* 1 — Responsable du traitement */}
          <Section icon={<Lock size={20} color={palette.primary} />} title="1. Responsable du traitement">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Le responsable du traitement de vos données personnelles est :
            </Text>
            <Bullet label="Éditeur :" value="MouhaDev" />
            <Bullet label="Email DPO :" value="privacy@xalaat.app" />
            <Bullet label="Support :" value="support@xalaat.app" />
            <Text className="text-txt-60 text-sm leading-relaxed mt-3">
              Xalaat s&apos;engage à protéger la vie privée de ses utilisateurs dans le respect des
              réglementations applicables à l&apos;échelle mondiale.
            </Text>
          </Section>

          {/* 2 — Données collectées */}
          <Section icon={<Database size={20} color={palette.gold} />} title="2. Données collectées">
            <Text className="text-txt font-semibold text-sm mb-2">Fournies par vous :</Text>
            <Bullet label="Compte :" value="nom d'utilisateur, adresse email." />
            <Bullet label="Sécurité :" value="mot de passe haché bcrypt — jamais stocké en clair." />
            <Bullet
              label="Connexion tierce (Google / Apple) :"
              value="identifiant OAuth et email fourni par le fournisseur."
            />
            <Bullet
              label="Support :"
              value="email de contact (optionnel) et contenu de vos messages."
            />

            <Text className="text-txt font-semibold text-sm mb-2 mt-4">Collectées automatiquement :</Text>
            <Bullet
              label="Jeu :"
              value="scores, historique des parties, rangs et statistiques."
            />
            <Bullet
              label="Notifications :"
              value="token push de votre appareil (invitations, alertes)."
            />
            <Bullet
              label="Technique :"
              value="adresse IP (anonymisée après 30 jours), type d'appareil, version OS, langue."
            />
            <Bullet
              label="Publicités :"
              value="identifiant publicitaire (IDFA / GAID) — uniquement avec votre consentement."
            />

            <View className="mt-4 p-3 rounded-2xl bg-bg border border-line">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">Non collecté : </Text>
                géolocalisation précise, contacts, photos personnelles, données de paiement,
                données biométriques.
              </Text>
            </View>
          </Section>

          {/* 3 — Bases légales */}
          <Section icon={<Eye size={20} color={palette.indigo} />} title="3. Bases légales du traitement (RGPD)">
            <TableRow col1="Traitement" col2="Base légale" header />
            <TableRow col1="Création et gestion du compte" col2="Exécution du contrat (art. 6§1b)" />
            <TableRow col1="Communications liées au service" col2="Exécution du contrat" />
            <TableRow col1="Publicités personnalisées" col2="Consentement (art. 6§1a)" />
            <TableRow col1="Statistiques, amélioration" col2="Intérêts légitimes (art. 6§1f)" />
            <TableRow col1="Sécurité, prévention fraude" col2="Intérêts légitimes" />
            <TableRow col1="Obligations légales" col2="Obligation légale (art. 6§1c)" />
          </Section>

          {/* 4 — Partage des données */}
          <Section icon={<Globe size={20} color={palette.primary} />} title="4. Partage des données">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Nous ne vendons <Text className="text-txt font-bold">jamais</Text> vos données
              personnelles à des tiers. Vos données peuvent être partagées avec :
            </Text>
            <TableRow col1="Destinataire" col2="Raison" header />
            <TableRow col1="Supabase (hébergement)" col2="Infrastructure technique" />
            <TableRow col1="Régies publicitaires" col2="Publicités (avec consentement)" />
            <TableRow col1="Google / Apple (OAuth)" col2="Authentification uniquement" />
            <TableRow col1="Autorités légales" col2="Sur réquisition valide" />

            <Text className="text-txt-60 text-xs leading-relaxed mt-3">
              Tous nos sous-traitants sont liés par des clauses contractuelles types (CCT)
              conformes au RGPD ou par des garanties équivalentes.
            </Text>
          </Section>

          {/* 5 — Durées de conservation */}
          <Section icon={<Clock size={20} color={palette.good} />} title="5. Durées de conservation">
            <TableRow col1="Données" col2="Durée" header />
            <TableRow col1="Compte actif" col2="Durée de vie du compte" />
            <TableRow col1="Données de jeu" col2="Compte + 3 mois après suppression" />
            <TableRow col1="Tickets de support" col2="3 ans après clôture" />
            <TableRow col1="Logs techniques / IP" col2="30 jours (IP anonymisée ensuite)" />
            <TableRow col1="Consentement publicitaire" col2="13 mois (renouvellement requis)" />
            <TableRow col1="Après suppression du compte" col2="Purge définitive sous 30 jours" />
          </Section>

          {/* 6 — Vos droits */}
          <Section icon={<UserCheck size={20} color={palette.good} />} title="6. Vos droits">
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Conformément au RGPD, CCPA et législations applicables, vous disposez des droits
              suivants, exerçables à tout moment :
            </Text>
            <Bullet label="Accès (art. 15 RGPD) :" value="obtenir une copie de vos données." />
            <Bullet label="Rectification (art. 16) :" value="corriger des données inexactes." />
            <Bullet label="Effacement (art. 17) :" value="droit à l'oubli." />
            <Bullet
              label="Portabilité (art. 20) :"
              value="recevoir vos données dans un format structuré."
            />
            <Bullet
              label="Opposition (art. 21) :"
              value="vous opposer au traitement sur intérêt légitime."
            />
            <Bullet
              label="Retrait du consentement :"
              value="révoquer votre accord pour les publicités ciblées."
            />
            <Bullet
              label="Réclamation :"
              value="saisir une autorité de contrôle (CNIL, CDP Sénégal…)."
            />

            <View className="mt-4 p-3 rounded-2xl bg-bg border border-line">
              <Text className="text-txt-60 text-xs leading-relaxed">
                <Text className="text-txt font-semibold">Utilisateurs californiens (CCPA/CPRA) : </Text>
                droit supplémentaire de ne pas faire vendre vos informations et de
                non-discrimination lors de l&apos;exercice de vos droits.
              </Text>
            </View>

            <Text className="text-txt-60 text-sm leading-relaxed mt-3">
              Pour exercer vos droits, contactez-nous à{' '}
              <Text className="text-accent font-semibold">privacy@xalaat.app</Text>. Réponse
              garantie sous 30 jours.
            </Text>
          </Section>

          {/* 7 — Mineurs */}
          <Section icon={<AlertTriangle size={20} color={palette.gold} />} title="7. Protection des mineurs">
            <Text className="text-txt-60 text-sm leading-relaxed">
              L&apos;Application est réservée aux personnes âgées d&apos;au moins{' '}
              <Text className="text-txt font-bold">13 ans</Text>. Nous ne collectons pas
              sciemment de données sur des enfants de moins de 13 ans. Si vous pensez
              qu&apos;un enfant nous a fourni ses informations, contactez-nous immédiatement
              à{' '}
              <Text className="text-accent font-semibold">privacy@xalaat.app</Text> — ses
              données seront supprimées dans les meilleurs délais.
            </Text>
            <Text className="text-txt-60 text-xs leading-relaxed mt-3">
              Dans l&apos;UE, l&apos;âge du consentement numérique de votre État membre
              s&apos;applique. Le cas échéant, le consentement parental est requis.
            </Text>
          </Section>

          {/* 8 — Sécurité */}
          <Section icon={<Shield size={20} color={palette.primary} />} title="8. Sécurité des données">
            <Bullet label="Transit :" value="chiffrement TLS 1.3." />
            <Bullet label="Mots de passe :" value="hachage bcrypt — jamais en clair." />
            <Bullet label="Sessions :" value="tokens JWT à courte durée de vie." />
            <Bullet label="Accès :" value="principe du moindre privilège." />
            <Bullet label="Surveillance :" value="journalisation des accès sensibles." />
            <Text className="text-txt-60 text-sm leading-relaxed mt-3">
              En cas de violation susceptible d&apos;affecter vos droits, vous en serez
              informé dans les <Text className="text-txt font-semibold">72 heures</Text>{' '}
              conformément à l&apos;art. 33 RGPD.
            </Text>
          </Section>

          {/* 9 — Contact */}
          <Section icon={<Mail size={20} color={palette.indigo} />} title="9. Contact & Réclamation">
            <Bullet label="DPO :" value="privacy@xalaat.app" />
            <Bullet label="Support :" value="support@xalaat.app" />
            <Text className="text-txt font-semibold text-sm mt-3 mb-2">
              Autorités de contrôle compétentes :
            </Text>
            <Bullet label="🇫🇷 France / UE :" value="CNIL — www.cnil.fr" />
            <Bullet label="🇸🇳 Sénégal :" value="CDP — www.cdp.sn" />
            <Bullet label="🇺🇸 Californie :" value="California Privacy Protection Agency (CPPA)" />
            <Text className="text-txt-60 text-xs leading-relaxed mt-3">
              Pour tout autre pays, vous pouvez saisir l&apos;autorité nationale de protection
              des données de votre pays de résidence.
            </Text>
          </Section>

          {/* Modifications */}
          <View className="p-4 rounded-2xl bg-surface border border-line">
            <Text className="text-txt-60 text-xs leading-relaxed">
              <Text className="text-txt font-semibold">Modifications : </Text>
              toute modification substantielle sera notifiée via l&apos;Application ou par
              email avec un préavis de 30 jours. La version en vigueur est toujours
              accessible depuis l&apos;Application.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
