import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  private readonly TOKEN_PATH = path.resolve(__dirname, '../../data/google-token.json');

  constructor(config: GoogleAuthConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Genera URL per autorizzazione Google OAuth2
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent' // Force consent screen per ottenere refresh_token
    });
  }

  /**
   * Scambia authorization code per access token
   */
  async getTokenFromCode(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Salva tokens su file per persistenza
      await this.saveTokens(tokens);
      
      return tokens as GoogleTokens;
    } catch (error) {
      throw new Error(`Errore durante ottenimento token: ${error}`);
    }
  }

  /**
   * Carica tokens salvati dal file system
   */
  async loadTokens(): Promise<GoogleTokens | null> {
    try {
      if (!fs.existsSync(this.TOKEN_PATH)) {
        return null;
      }
      
      const tokenData = fs.readFileSync(this.TOKEN_PATH, 'utf-8');
      const tokens = JSON.parse(tokenData) as GoogleTokens;
      
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Errore caricamento tokens:', error);
      return null;
    }
  }

  /**
   * Salva tokens su file system
   */
  private async saveTokens(tokens: any): Promise<void> {
    try {
      // Assicura che la directory esista
      const tokenDir = path.dirname(this.TOKEN_PATH);
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }
      
      fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Errore salvataggio tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token utilizzando refresh token
   */
  async refreshTokens(): Promise<GoogleTokens | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      // Salva i nuovi tokens
      await this.saveTokens(credentials);
      
      return credentials as GoogleTokens;
    } catch (error) {
      console.error('Errore refresh tokens:', error);
      return null;
    }
  }

  /**
   * Verifica se i tokens sono validi e non scaduti
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens) return false;

      // Controlla se il token è scaduto
      if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
        // Prova a fare refresh
        const refreshedTokens = await this.refreshTokens();
        return refreshedTokens !== null;
      }

      return true;
    } catch (error) {
      console.error('Errore verifica autenticazione:', error);
      return false;
    }
  }

  /**
   * Revoca tokens e disconnette account Google
   */
  async disconnect(): Promise<void> {
    try {
      // Revoca il token presso Google
      if (this.oauth2Client.credentials.access_token) {
        await this.oauth2Client.revokeCredentials();
      }
      
      // Rimuovi il file dei tokens
      if (fs.existsSync(this.TOKEN_PATH)) {
        fs.unlinkSync(this.TOKEN_PATH);
      }
      
      // Reset credentials
      this.oauth2Client.setCredentials({});
    } catch (error) {
      console.error('Errore disconnessione:', error);
      throw error;
    }
  }

  /**
   * Ottieni client OAuth2 configurato per le API Google
   */
  getAuthenticatedClient(): OAuth2Client {
    return this.oauth2Client;
  }

  /**
   * Ottieni info sull'utente autenticato
   */
  async getUserInfo(): Promise<any> {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Errore ottenimento info utente:', error);
      throw error;
    }
  }

  /**
   * Scambia authorization code per access token (alias per compatibilità)
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    return this.getTokenFromCode(code);
  }

  /**
   * Revoca tokens specifici (alias per compatibilità)
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.warn('Errore revoca token:', error);
      throw error;
    }
  }
}

// Configurazione di default (da variabili d'ambiente o placeholder)
const defaultConfig: GoogleAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
};

// Esporta istanza singleton
export const googleAuthService = new GoogleAuthService(defaultConfig);
