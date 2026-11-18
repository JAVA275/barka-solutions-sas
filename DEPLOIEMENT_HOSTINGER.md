# 🚀 GUIDE DE DÉPLOIEMENT BARKA SOLUTIONS S.A.S SUR HOSTINGER

Ce guide vous accompagne pas à pas pour déployer la plateforme **BARKA SOLUTIONS S.A.S** sur votre hébergement Hostinger.

Le fichier d'archive prêt à l'emploi est situé à :
`barka-solutions-hostinger.zip` (sur votre Bureau et à la racine du projet).

---

## 📁 CONTENU DU PACK PRÊT POUR HOSTINGER

* `dist/` : Frontend React compilé (HTML/CSS/JS) et serveur autonome backend Node.js (`dist/server.cjs`).
* `server/data/store.json` : Base de données locale de démarrage (services, devis, portfolio, utilisateurs, paramètres).
* `public/` : Logos officiels, robots.txt et sitemap.xml.
* `uploads/` : Dossiers permanents pour stocker les pièces jointes des devis et les images du portfolio.
* `package.json` : Dépendances de production allégées (Express, JWT, Multer, bcryptjs, etc.).
* `ecosystem.config.cjs` : Fichier de configuration PM2 pour maintenir le serveur actif 24h/24.
* `.env` : Fichier des variables d'environnement de production.

---

## 🎯 MÉTHODE 1 : HÉBERGEMENT WEB OU CLOUD HOSTINGER (hPanel)

Si vous utilisez le panneau de configuration **hPanel** de Hostinger :

### Étape 1 : Téléverser le fichier ZIP
1. Connectez-vous à votre compte **Hostinger** et ouvrez votre **hPanel**.
2. Allez dans **Sites Web** > Cliquez sur **Gérer** devant votre domaine.
3. Cliquez sur **Gestionnaire de fichiers** (File Manager) dans le menu de gauche.
4. Entrez dans le dossier racine de votre site (généralement `public_html`).
5. Cliquez sur le bouton **Téléverser** (Upload) en haut à droite et sélectionnez le fichier :
   `barka-solutions-hostinger.zip`.
6. Faites un clic droit sur le fichier zip uploadé et choisissez **Extraire** (Extract) dans le dossier courant (`public_html` ou le sous-dossier de votre choix).

### Étape 2 : Activer Node.js dans hPanel
1. Dans le menu de gauche de hPanel, cherchez **Node.js** (ou sous la section *Avancé* / *Applications*).
2. Cliquez sur **Créer une application Node.js** (ou Activer Node.js) :
   * **Version de Node.js** : Sélectionnez **Node.js 20.x** ou **Node.js 22.x**.
   * **Mode de l'application** : `Production`.
   * **Répertoire racine de l'application (Application root)** : Chemin vers les fichiers extraits (ex. `/public_html` ou `/home/.../public_html`).
   * **Fichier de démarrage de l'application (Application startup file)** : `dist/server.cjs`.
   * **Port** : Laissez la valeur attribuée par Hostinger ou indiquez `3000`.

### Étape 3 : Installer les dépendances
1. Toujours dans la section Node.js du hPanel, cliquez sur le bouton **Installer les packages npm** (ou **Run npm install**).
2. Hostinger va automatiquement installer les modules requis listés dans `package.json`.

### Étape 4 : Démarrer l'application
1. Cliquez sur le bouton **Démarrer** (Start) ou **Redémarrer** (Restart) dans l'interface Node.js de hPanel.
2. Votre site **BARKA SOLUTIONS S.A.S** est désormais en ligne avec son espace administration et sa gestion de devis fonctionnels !

---

## ⚡ MÉTHODE 2 : SERVEUR VPS HOSTINGER (KVM VPS avec Ubuntu)

Si vous avez choisi un serveur VPS chez Hostinger (accès SSH en ligne de commande) :

### Étape 1 : Connexion au VPS
Ouvrez votre terminal (PowerShell, Git Bash ou PuTTY) et connectez-vous :
```bash
ssh root@IP_DE_VOTRE_VPS
```

### Étape 2 : Préparer l'environnement (si nouveau serveur)
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 20 LTS et npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs unzip nginx

# Installer PM2 pour garder le serveur allumé 24h/24
sudo npm install -g pm2
```

### Étape 3 : Déposer et extraire l'application
Depuis votre ordinateur local, vous pouvez envoyer le zip vers le VPS :
```bash
scp "barka-solutions-hostinger.zip" root@IP_DE_VOTRE_VPS:/var/www/
```
Puis sur le VPS :
```bash
mkdir -p /var/www/barka-solutions
cd /var/www/barka-solutions
unzip /var/www/barka-solutions-hostinger.zip

# Installer les dépendances
npm install --omit=dev
```

### Étape 4 : Lancer avec PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Étape 5 : Configurer Nginx (Redirection vers le domaine)
Créez la configuration Nginx :
```bash
sudo nano /etc/nginx/sites-available/barkasolutions
```
Collez la configuration suivante (remplacez `votre-domaine.com` par votre vrai domaine) :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    client_max_body_size 60M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Activez le site et rechargez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/barkasolutions /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Étape 6 : Activer le HTTPS gratuit (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## 🔒 ACCÈS À L'ESPACE ADMINISTRATION

Une fois déployé :
* **URL publique du site** : `https://votre-domaine.com/`
* **URL d'accès administrateur** : `https://votre-domaine.com/admin/login`
* **Identifiant par défaut** : `admin`
* **Mot de passe par défaut** : `BarkaAdmin@2026!`

*(Pensez à modifier le mot de passe depuis le Tableau de Bord > Utilisateurs une fois connecté).*
