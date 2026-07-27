import colors from "@/constants/colors";
import { Separator } from "@/components/ui/separator";

function TermsConditions() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full mt-13 p-8 flex flex-col gap-8">
        <Header />
        <div className="flex flex-col gap-2">
          <SectionHeader Title="Introduction" />
          <p className="text-xs" style={{ color: colors.heading }}>
            Welcome to eLikas, a Progressive Web Application (PWA) designed to
            support communities and local government units during disaster
            events in the Philippines. eLikas provides crowdsourced evacuation
            information, real-time status updates, and tools to assist barangays
            in managing their evacuation plans. <br />
            <br />
            These Terms and Conditions, together with the Privacy Policy set out
            below, govern your access to and use of the eLikas platform. Please
            read this document carefully before registering or using our
            services. By accessing eLikas, you agree to be bound by these terms.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <SectionHeader Title="Part I: Terms and Conditions" />
          <div className="flex flex-col gap-4">
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>1. Acceptance of Terms</b>
              <p>
                By accessing, downloading, installing, or using the eLikas
                platform in any way, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions.
                These terms apply to all users, including individuals, barangay
                officials, and local government units (LGUs). If you do not
                agree with any part of these terms, you must immediately stop
                using the platform. eLikas reserves the right to update or
                modify these Terms at any time. Continued use of the platform
                after changes take effect constitutes your acceptance of the
                revised terms. Users will be notified of significant changes via
                email or an in-app notice.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>2. User Eligibility and Account Registration</b>
              <p>
                To use eLikas, you must meet the following eligibility
                requirements: <br />• You must be at least thirteen (13) years
                of age. Users below 18 years old must have consent from a parent
                or legal guardian. <br />• You must reside in or have a
                legitimate interest in the Philippines, particularly in areas
                served by eLikas. <br />• You must provide accurate and truthful
                information during registration. <br />• Barangay officials and
                LGU representatives must register using their official capacity
                and are responsible for actions taken under their accounts.
                <br />
                <br /> When registering an account, you agree to: <br />•
                Provide a valid email address and, optionally, a contact number.{" "}
                <br />• Maintain the confidentiality of your account
                credentials. <br />
                • Notify eLikas immediately if you suspect unauthorized use of
                your account. <br />• Accept sole responsibility for all
                activities carried out under your account. <br />
                <br />
                eLikas uses Firebase Authentication to manage user accounts. By
                registering, you also agree to Firebase's applicable terms of
                service.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>3. Permitted and Prohibited Uses</b>
              <p>
                You are permitted to use eLikas for the following lawful
                purposes: <br />• Reporting evacuation-related information, such
                as road conditions, shelter availability, and hazard alerts
                during disasters. <br />• Viewing crowdsourced reports and
                official evacuation instructions from barangay and LGU accounts.{" "}
                <br />• Planning and managing barangay evacuation routes and
                shelter assignments (for authorized officials). <br />•
                Communicating important safety information to community members.
                <br />
                <br />
                The following uses are strictly prohibited: <br />• Submitting
                false, misleading, or fabricated evacuation reports or disaster
                information. <br />• Using the platform to spread
                misinformation, panic, or content that could endanger lives.{" "}
                <br />• Impersonating a barangay official, government
                representative, or another user. <br />• Harvesting, scraping,
                or collecting user data without authorization. <br />•
                Attempting to gain unauthorized access to restricted features or
                accounts. <br />• Using the platform for commercial advertising,
                political campaigning, or any purpose unrelated to disaster
                response. <br />• Transmitting harmful, offensive, or illegal
                content of any kind. <br />
                <br />
                eLikas employs the OpenAI Moderation API to detect and filter
                content that violates these guidelines. Content found to be in
                violation may be removed, and the associated account may be
                suspended or permanently banned.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>4. Intellectual Property Rights</b>
              <p>
                All content, software, design elements, trademarks, logos, and
                materials within the eLikas platform are the intellectual
                property of the eLikas team and its developers, unless otherwise
                indicated. This includes, but is not limited to, the eLikas
                name, logo, source code, user interface design, and written
                materials. <br />
                You are granted a limited, non-exclusive, non-transferable
                license to use eLikas solely for its intended purposes as
                described in these Terms. You may not: <br />• Copy, reproduce,
                or redistribute any part of the eLikas platform without prior
                written consent. <br />• Modify, translate, adapt, or create
                derivative works based on the platform. <br />•
                Reverse-engineer, decompile, or disassemble any component of the
                platform. <br />
                <br />
                Map data displayed within eLikas is sourced from OpenStreetMap,
                which is made available under the Open Database License (ODbL).
                Contributions to OpenStreetMap data remain the property of their
                respective contributors under their applicable licenses.
                <br />
                <br />
                User-submitted content (such as reports and photographs) remains
                the property of the submitting user. However, by submitting
                content through eLikas, you grant the eLikas team a
                non-exclusive, royalty-free license to display, distribute, and
                use that content within the platform for disaster response and
                public safety purposes.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>5. Disclaimers and Limitation of Liability</b>
              <p>
                eLikas is a public safety support tool that relies on
                crowdsourced and community-reported information. While we strive
                to provide accurate and timely information, eLikas makes no
                warranties, express or implied, regarding: <br />• The accuracy,
                completeness, or reliability of any information submitted by
                users. <br />• The continuous availability or uninterrupted
                operation of the platform, particularly during disasters when
                network conditions may be affected. <br />• The suitability of
                any evacuation route or shelter information for any specific
                individual's circumstances. <br />
                <br />
                eLikas and its team shall not be held liable for any loss,
                injury, damage, or harm — whether direct, indirect, incidental,
                or consequential — arising from: <br />• Reliance on information
                posted through the platform. <br />• Failure to receive alerts
                or notifications due to technical issues. <br />• Decisions made
                by individuals or officials based on platform data. <br />
                <br />
                In all cases, users are advised to also consult official
                government channels, such as NDRRMC, local DRRMO offices, and
                official LGU announcements, for verified disaster information.
                eLikas is a supplementary tool and does not replace official
                government communications.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>6. Termination</b>
              <p>
                eLikas reserves the right to suspend or permanently terminate
                your account, with or without prior notice, if: <br />• You are
                found to have violated any provision of these Terms and
                Conditions. <br />• You engage in fraudulent, abusive, or
                harmful behavior on the platform. <br />• Your account is
                suspected of being compromised and poses a risk to other users.{" "}
                <br />• Legal or regulatory requirements necessitate the removal
                of your account.
                <br />
                <br />
                You may also delete your own account at any time by accessing
                your account settings or by sending a written request to
                elikasteam@gmail.com. Upon termination, your right to access and
                use eLikas will immediately cease. Provisions of these Terms
                that by their nature should survive termination — including
                intellectual property rights, disclaimers, and limitation of
                liability — shall continue to apply.
              </p>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <SectionHeader
            Title="Part II: Privacy Policy"
            Description="eLikas is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, why we collect it, how it is used, and how you can exercise your rights. We comply with applicable Philippine data privacy laws, including Republic Act No. 10173, also known as the Data Privacy Act of 2012, and its Implementing Rules and Regulations."
          />
          <div className="flex flex-col gap-4">
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>7. Personal Data We Collect</b>
              <p>
                When you use eLikas, we may collect the following types of
                information: <br />
                <br />
                <b>Account Information:</b> <br />• Full name — collected during
                account registration to identify you on the platform. <br />•
                Email address — used for account authentication, notifications,
                and communications. <br />
                • Residency - collected during account registration to identify
                your geographical location and receive SMS broadcasts from your
                registered barangay. <br />• Contact number (optional) — may be
                used for SMS-based emergency notifications if you opt in.
                <br />
                <br />
                <b>Location Data:</b>
                <br />• Your device's real-time geographic location, collected
                only when you actively use location-based features (such as
                submitting a report or viewing nearby evacuation routes).
                Location access requires your explicit permission. <br />
                <br />
                <b>Usage Data:</b> <br />• Log data such as your device type,
                operating system, browser or app version, and IP address. <br />
                • In-app activity, such as reports submitted, pages viewed, and
                features used, to improve platform performance and user
                experience.
                <br />
                <br /> <b>User-Submitted Content:</b> <br />• Reports,
                descriptions, and photographs submitted by you through the
                platform. <br />
                <br />
                We do not collect sensitive personal information such as
                government ID numbers, financial information, health data, or
                political or religious views.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>8. How Your Data Is Used</b>
              <p>
                The data we collect is used strictly for the following purposes:
                <br />• To authenticate and manage your user account. <br />• To
                display relevant evacuation information and crowdsourced reports
                based on your location. <br />• To support barangay officials
                and LGUs in their evacuation planning and management. <br />• To
                moderate user-submitted content and prevent the spread of false
                or harmful information. <br />• To improve the platform's
                features, stability, and overall performance. <br />• To comply
                with applicable legal obligations. <br />
                <br />
                We do not use your data for commercial advertising, profiling
                for marketing purposes, or any purpose unrelated to public
                safety and disaster response.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>9. Third-Party Sharing and Services</b>
              <p>
                eLikas integrates with the following third-party services to
                deliver its features. By using eLikas, you acknowledge that data
                may be processed by these providers in accordance with their own
                privacy policies: <br />
                <br />
                <b>OpenStreetMap</b>: <br />
                eLikas uses map data and tiles provided by OpenStreetMap
                (openstreetmap.org) to display evacuation routes and geographic
                information. Map data is accessed publicly and does not involve
                the transmission of your personal data to OpenStreetMap. <br />
                <br />
                <b>OpenAI Moderation API:</b> <br />
                User-submitted content is reviewed by the OpenAI Moderation API to 
                detect and filter harmful, false, or policy-violating content before 
                it is published. Comments submitted through eLikas may be processed 
                using OpenAI services for semantic analysis to identify potentially 
                harmful, abusive, or inappropriate content. This automated processing 
                is performed solely for content moderation purposes. By submitting 
                comments through the platform, users acknowledge and consent to this 
                processing. <br />
                <br />
                However, automated semantic analysis may occasionally produce inaccurate 
                results. Comments may be incorrectly flagged or may not be detected despite 
                the system's best efforts. OpenAI moderation is intended to assist the
                 moderation process and should not be considered a substitute for administrative 
                 review when necessary. <br />
                <br />
                <b>Firebase Authentication (Google):</b> <br />
                We use Firebase Authentication, a service provided by Google
                LLC, to securely manage user account creation and login. Your
                email address and authentication credentials are processed by
                Firebase. Please refer to Google's Privacy Policy for further
                information. <br />
                <br />
                <b>SMS Broadcasting API:</b> <br />
                For users who provide an optional contact number and consent to
                SMS notifications, we may use an SMS broadcasting service to
                send emergency alerts and updates. Your contact number will only
                be shared with the SMS provider for the purpose of delivering
                these messages and will not be used for any other purpose. We do
                not sell, rent, or trade your personal data to any third party
                for commercial purposes.
                <br />
                <br />
                We may disclose your information only when required by law, or
                in response to lawful requests from government authorities.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>10. Cookie Policy</b>
              <p>
                eLikas is a Progressive Web Application (PWA) and may use
                browser-based storage technologies, including cookies and local
                storage, to enhance your experience. These may be used for the
                following purposes: <br />• Performance and analytics — to
                understand how users interact with the app, in order to improve
                usability. <br />
                <br />
                You can manage or clear cookies and local storage through your
                browser or device settings. Please note that disabling these
                technologies may affect the functionality of certain features
                within eLikas. We do not use cookies for advertising or
                cross-site tracking purposes.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>11. Your Rights as a Data Subject</b>
              <p>
                Under the Data Privacy Act of 2012 (Republic Act No. 10173), you
                have the following rights with respect to your personal data:{" "}
                <br />• Right to Access — You may request a copy of the personal
                data we hold about you. <br />• Right to Correction — You may
                request that inaccurate or incomplete data be corrected. <br />•
                Right to Erasure — You may request the deletion of your personal
                data, subject to any legal obligations that require us to retain
                it. <br />• Right to Object — You may object to the processing
                of your personal data for specific purposes. <br />• Right to
                Data Portability — You may request your data in a structured,
                commonly used, and machine-readable format. <br />• Right to
                Opt-Out — You may withdraw your consent at any time for optional
                data processing activities, such as SMS notifications, without
                affecting the lawfulness of prior processing. <br />
                <br />
                To exercise any of these rights, please send a written request
                to elikasteam@gmail.com. We will respond within a reasonable
                timeframe and in accordance with applicable law.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>12. Data Retention</b>
              <p>
                We retain your personal data only for as long as is necessary to
                fulfill the purposes outlined in this Privacy Policy, or as
                required by applicable laws and regulations. The following
                general retention periods apply: <br />• Account data (name,
                email, contact number) — retained for as long as your account
                remains active. Upon account deletion, this data will be removed
                within thirty (30) days, except where retention is required by
                law. <br />• User-submitted content (reports, photographs) —
                retained for disaster response and historical reference
                purposes. Content may be anonymized or removed upon request.{" "}
                <br />• Usage and log data — typically retained for up to twelve
                (12) months for security and performance analysis purposes,
                after which it is deleted or anonymized. <br />• Location data —
                collected only in real time during active use and is not stored
                beyond the immediate session unless you explicitly submit a
                location-tagged report. <br />
                <br />
                Upon the permanent deletion of your account, we will take
                reasonable steps to ensure that your personal data is removed
                from our active systems within thirty (30) days. Some data may
                remain in backup systems for a limited period before being fully
                purged.
              </p>
            </p>
            <p
              className="text-xs flex flex-col gap-2"
              style={{ color: colors.heading }}
            >
              <b>13. Contact and Data Privacy Inquiries</b>
              <p>
                If you have any questions, concerns, or requests related to
                these Terms and Conditions or our Privacy Policy, please do not
                hesitate to contact us: <br />
                <br />
                <b>Email: </b>
                <span style={{ color: colors.activeIcon }}>
                  elikasteam@gmail.com
                </span>{" "}
                <br />
                <br />
                We are committed to addressing your concerns promptly and in
                accordance with the Data Privacy Act of 2012 and its
                Implementing Rules and Regulations.
              </p>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center flex justify-center items-center flex-col">
        <h1 className="font-bold text-4xl" style={{ color: colors.activeIcon }}>
          eLikas
        </h1>
        <p className="text-sm italic" style={{ color: colors.heading }}>
          Evacuation and Support Platform
        </p>
      </div>
      <div className="flex gap-2 flex-col">
        <Separator className="bg-orange-300" />
        <p
          className="text-center font-bold text-md"
          style={{ color: colors.heading }}
        >
          Terms and Conditions & Privacy Policy
        </p>
        <Separator className="bg-orange-300" />
      </div>
      <div className="flex flex-col text-center text-xs">
        <p style={{ color: colors.heading }}>Contact Us</p>
        <p style={{ color: colors.activeIcon }}>elikasteam@gmail.edu.ph</p>
      </div>
    </div>
  );
}

function SectionHeader({
  Title,
  Description,
}: {
  Title: string;
  Description?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-lg" style={{ color: colors.activeIcon }}>
          {Title}
        </h1>
        <Separator className="bg-orange-300" />
        <p className="text-xs" style={{ color: colors.heading }}>
          {Description}
        </p>
      </div>
    </>
  );
}

function Footer() {
  return (
    <div className="flex flex-col gap-2 text-center text-xs italic">
      <Separator className="bg-orange-300" />
      <p style={{ color: colors.heading }}>
        This document was last updated on July 27, 2025. eLikas reserves the
        right to amend these terms at any time. Continued use of the platform
        after any amendments constitutes your acceptance of the revised
        document.
      </p>
    </div>
  );
}

export default TermsConditions;
