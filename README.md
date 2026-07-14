# PAP – Product Audit Platform

Plateforme web full-stack de gestion des audits produit et de la certification des auditeurs pour **LEONI Tunisie**, fabricant de câblages automobiles (clients : BMW, VW, Mercedes, JLR, Stellantis).

Projet réalisé dans le cadre d'un PFE (Projet de Fin d'Études) – ENISO.

## Fonctionnalités principales

- **Audits produit (PI3010 / QK)** : formulaires Annexe 1A/1B, calcul du QK (moteur classique + comparaison IA), génération de rapports PDF.
- **Audits spéciaux** : Règle Plate, Magasin Export, auto-planification par les auditeurs, visibilité multi-site pour les experts.
- **Certification des auditeurs** : tests théoriques/pratiques, classification HR (score pondéré), suivi du cycle de qualification.
- **Non-conformités & PDCA** : gestion des plans d'action correctifs.
- **Reporting multi-site** : rapports mensuels cumulés, historique unifié par rôle (Auditeur, Chef de Service, Expert, Responsable, Admin).
- **Module IA** : Random Forest Regressor (prédiction QK, R² = 0.990) et Gradient Boosting Classifier (classification auditeurs, 97 % accuracy).

## Stack technique

| Couche         | Technologie                          |
|----------------|---------------------------------------|
| Backend        | Spring Boot (Java), Spring Security  |
| Frontend       | React + Vite                          |
| Base de données| PostgreSQL                            |
| Service IA     | Flask + Scikit-learn                  |
| Conteneurisation| Docker, Docker Compose, Nginx        |
| CI/CD          | GitHub Actions                        |

## Structure du projet

```
pap/
├── backend/            # API Spring Boot
│   └── src/main/java/com/leoni/pap/
│       ├── controller/     # Endpoints REST
│       ├── service/        # Logique métier
│       ├── entity/          # Entités JPA
│       ├── repository/      # Accès données (JPQL)
│       ├── dto/              # Requêtes / réponses
│       ├── security/        # Authentification & autorisations
│       ├── config/           # Configuration Spring
│       └── scheduler/        # Tâches planifiées
├── frontend/           # Application React
│   └── src/
│       ├── pages/            # Vues par rôle (auditeur, chef, expert, admin...)
│       ├── components/       # Composants réutilisables
│       ├── services/         # Appels API (axios)
│       ├── context/           # Contexte d'authentification
│       ├── hooks/              # Hooks personnalisés
│       └── i18n/                # Internationalisation
├── ia-service/         # Microservice Flask (modèles ML)
└── docker-compose.yml
```

## Rôles utilisateurs

`Auditeur` · `Chef de Service` · `Expert` · `Responsable` · `Responsable Magasin` · `Admin`

## Prérequis

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+ (service IA)
- Docker & Docker Compose (optionnel, déploiement)

## Installation

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Service IA
```bash
cd ia-service
pip install -r requirements.txt
python app.py
```

### Avec Docker
```bash
docker-compose up --build
```

Configurer les variables d'environnement dans un fichier `.env` à la racine (voir `.env.example`).

## Sites LEONI couverts

Sousse, Menzel Hayet, Mateur South, Mateur North, Sidi Bouali

## Méthodologie

Développement en Scrum, 6 sprints (S0–S5) + phases d'initialisation et de clôture.

## Auteur

Zaineb — Étudiante ingénieure, ENISO
