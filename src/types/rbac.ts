export type PermissionCategory =
  | 'user_management'
  | 'employee_management'
  | 'payroll_processing'
  | 'reporting'
  | 'audit'
  | 'administration'
  | 'platform_administration';

export type PermissionKey =
  // User Management
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'disable_user'
  | 'reset_password'
  | 'assign_roles'
  // Employee Management
  | 'create_employee'
  | 'edit_employee'
  | 'delete_employee'
  | 'import_employees'
  | 'export_employees'
  // Payroll Processing
  | 'upload_payroll_pdf'
  | 'split_payslips'
  | 'preview_payslips'
  | 'validate_distribution'
  | 'send_payslips'
  | 'retry_failed_emails'
  // Reporting
  | 'view_reports'
  | 'export_reports'
  | 'download_reports'
  // Audit
  | 'view_audit_logs'
  | 'export_audit_logs'
  // Administration
  | 'manage_company_settings'
  | 'configure_email'
  | 'manage_storage'
  | 'manage_integrations'
  // Platform Administration
  | 'manage_companies'
  | 'manage_platform_users'
  | 'manage_subscriptions'
  | 'configure_global_settings'
  | 'view_platform_analytics'
  | 'manage_feedback'
  | 'monitor_system_health';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: PermissionCategory;
}

export interface CustomRole {
  id: string;
  companyId: string; // Multi-tenant isolation (RB-03)
  name: string;
  description: string;
  permissions: PermissionKey[];
  isPredefined?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, { label: string; description: string }> = {
  user_management: {
    label: 'Gestion des Utilisateurs',
    description: 'Création, modification des comptes et attribution des rôles d\'accès.'
  },
  employee_management: {
    label: 'Gestion des Employés',
    description: 'Consultation, création, import et export des fiches salariés.'
  },
  payroll_processing: {
    label: 'Traitement de la Paie',
    description: 'Téléversement des PDF, découpage, validation et distribution des bulletins.'
  },
  reporting: {
    label: 'Rapports & Statistiques',
    description: 'Consultation et téléchargement des synthèses de livraison et d\'activité.'
  },
  audit: {
    label: 'Journal d\'Audit & Conformité',
    description: 'Consultation des traces de sécurité, accès et opérations système.'
  },
  administration: {
    label: 'Paramètres d\'Entreprise',
    description: 'Configuration SMTP, politique de mot de passe et intégrations.'
  },
  platform_administration: {
    label: 'Administration Plateforme (SaaS)',
    description: 'Réservé au Propriétaire de la plateforme pour la gestion globale.'
  }
};

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // User Management
  { key: 'create_user', label: 'Créer un Utilisateur', description: 'Ajouter un nouveau compte membre.', category: 'user_management' },
  { key: 'update_user', label: 'Modifier un Utilisateur', description: 'Mettre à jour les informations de profil.', category: 'user_management' },
  { key: 'delete_user', label: 'Supprimer un Utilisateur', description: 'Supprimer définitivement un compte.', category: 'user_management' },
  { key: 'disable_user', label: 'Activer / Désactiver', description: 'Bloquer ou débloquer les accès.', category: 'user_management' },
  { key: 'reset_password', label: 'Réinitialiser Mot de Passe', description: 'Déclencher la procédure de réinitialisation.', category: 'user_management' },
  { key: 'assign_roles', label: 'Attribuer des Rôles', description: 'Affecter des rôles et autorisations aux comptes.', category: 'user_management' },

  // Employee Management
  { key: 'create_employee', label: 'Créer Fiche Employé', description: 'Saisir un nouvel employé manuellement.', category: 'employee_management' },
  { key: 'edit_employee', label: 'Modifier Fiche Employé', description: 'Mettre à jour coordonnées et matricule.', category: 'employee_management' },
  { key: 'delete_employee', label: 'Supprimer un Employé', description: 'Retirer un employé de l\'annuaire.', category: 'employee_management' },
  { key: 'import_employees', label: 'Importer Annuaire (Excel/CSV)', description: 'Importer en masse des salariés.', category: 'employee_management' },
  { key: 'export_employees', label: 'Exporter Annuaire', description: 'Télécharger le registre du personnel.', category: 'employee_management' },

  // Payroll Processing
  { key: 'upload_payroll_pdf', label: 'Téléverser Fichier PDF', description: 'Déposer les lots de bulletins maîtres.', category: 'payroll_processing' },
  { key: 'split_payslips', label: 'Lancer le Découpage', description: 'Découper automatiquement par matricule.', category: 'payroll_processing' },
  { key: 'preview_payslips', label: 'Prévisualiser Bulletins', description: 'Vérifier la qualité d\'extraction.', category: 'payroll_processing' },
  { key: 'validate_distribution', label: 'Valider la Distribution', description: 'Approuver la campagne pour envoi.', category: 'payroll_processing' },
  { key: 'send_payslips', label: 'Distribuer (E-mail / WhatsApp)', description: 'Lancer la diffusion sécurisée.', category: 'payroll_processing' },
  { key: 'retry_failed_emails', label: 'Relancer les Échecs', description: 'Renvoyer les bulletins non distribués.', category: 'payroll_processing' },

  // Reporting
  { key: 'view_reports', label: 'Consulter les Rapports', description: 'Accéder aux statistiques et graphiques.', category: 'reporting' },
  { key: 'export_reports', label: 'Exporter les Rapports', description: 'Télécharger les rapports au format PDF/CSV.', category: 'reporting' },
  { key: 'download_reports', label: 'Télécharger Justificatifs', description: 'Obtenir les reçus de livraison horodatés.', category: 'reporting' },

  // Audit
  { key: 'view_audit_logs', label: 'Voir Registre d\'Audit', description: 'Consulter la traçabilité des opérations.', category: 'audit' },
  { key: 'export_audit_logs', label: 'Exporter Registre d\'Audit', description: 'Télécharger les preuves d\'audit pour conformité.', category: 'audit' },

  // Administration
  { key: 'manage_company_settings', label: 'Gérer Profil Entreprise', description: 'Modifier nom, logo et informations légale.', category: 'administration' },
  { key: 'configure_email', label: 'Configurer SMTP & Modèles', description: 'Paramétrer les envois d\'e-mails et mots de passe PDF.', category: 'administration' },
  { key: 'manage_storage', label: 'Gérer le Stockage', description: 'Consulter et purger l\'espace de stockage.', category: 'administration' },
  { key: 'manage_integrations', label: 'Gérer Intégrations API', description: 'Configurer WhatsApp, Webhooks et API.', category: 'administration' },

  // Platform Administration
  { key: 'manage_companies', label: 'Gérer les Entreprises (SaaS)', description: 'Surcharger, suspendre ou supprimer des tenants.', category: 'platform_administration' },
  { key: 'manage_platform_users', label: 'Supervision Utilisateurs SaaS', description: 'Consulter l\'ensemble des utilisateurs globaux.', category: 'platform_administration' },
  { key: 'manage_subscriptions', label: 'Gérer Abonnements & Offres', description: 'Changer les forfaits et limites de stockage.', category: 'platform_administration' },
  { key: 'configure_global_settings', label: 'Paramètres Globaux SaaS', description: 'Configurer le système multi-locataire.', category: 'platform_administration' },
  { key: 'view_platform_analytics', label: 'Analytique Plateforme', description: 'Consulter la santé financière et technique SaaS.', category: 'platform_administration' },
  { key: 'manage_feedback', label: 'Traiter les Tickets Support', description: 'Répondre aux demandes et retours d\'expérience.', category: 'platform_administration' },
  { key: 'monitor_system_health', label: 'Monitoring Système', description: 'Surveiller les métriques serveur et disponibilité.', category: 'platform_administration' }
];
