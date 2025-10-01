"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const auth_1 = require("firebase/auth");
const storage_1 = require("firebase/storage");
const firestore_2 = require("firebase/firestore");
const storage_2 = require("firebase/storage");
class FirebaseService {
    constructor(firebaseConfig) {
        // Função auxiliar para converter Timestamp para Date
        this.convertTimestamp = (timestamp) => {
            if (timestamp instanceof firestore_2.Timestamp) {
                return timestamp.toDate();
            }
            return timestamp;
        };
        // Função auxiliar para converter Date para Timestamp
        this.convertToTimestamp = (date) => {
            if (date) {
                return firestore_2.Timestamp.fromDate(date);
            }
            return undefined;
        };
        this.app = (0, app_1.initializeApp)(firebaseConfig);
        this.db = (0, firestore_1.getFirestore)(this.app);
        this.auth = (0, auth_1.getAuth)(this.app);
        this.storage = (0, storage_1.getStorage)(this.app);
    }
    // ===== SERVIÇOS DE USUÁRIOS =====
    async getAllUsuarios() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'usuarios'));
        const usuarios = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let equipe = null;
            if (data.idEquipe) {
                try {
                    equipe = await this.getEquipeById(data.idEquipe);
                }
                catch (error) {
                    console.warn('Erro ao buscar equipe do usuário:', error);
                }
            }
            return {
                id: doc.id,
                ...data,
                dataCriacao: this.convertTimestamp(data.dataCriacao),
                equipe
            };
        }));
        return usuarios;
    }
    async getUsuarioById(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'usuarios', id);
        const docSnap = await (0, firestore_2.getDoc)(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                dataCriacao: this.convertTimestamp(docSnap.data().dataCriacao)
            };
        }
        return null;
    }
    async getUsuarioByLogin(login) {
        const q = (0, firestore_2.query)((0, firestore_2.collection)(this.db, 'usuarios'), (0, firestore_2.where)('login', '==', login));
        const querySnapshot = await (0, firestore_2.getDocs)(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
            };
        }
        return null;
    }
    async createUsuario(usuario) {
        if (usuario.tipo === 'usuario') {
            // Criar equipe automaticamente
            const equipeData = {
                nomeEquipe: usuario.nomeEquipe || usuario.nome,
                cidade: usuario.estado || 'A definir',
                tecnico: usuario.nome,
                telefone: '',
                email: '',
                observacoes: usuario.observacoes || '',
                dataCriacao: firestore_2.Timestamp.now()
            };
            const equipeRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'equipes'), equipeData);
            const equipeId = equipeRef.id;
            const usuarioData = {
                ...usuario,
                chefeEquipe: true,
                idEquipe: equipeId,
                dataCriacao: firestore_2.Timestamp.now()
            };
            const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'usuarios'), usuarioData);
            await (0, firestore_2.updateDoc)(equipeRef, { idChefe: docRef.id });
            return docRef.id;
        }
        else {
            const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'usuarios'), {
                ...usuario,
                chefeEquipe: false,
                dataCriacao: firestore_2.Timestamp.now()
            });
            return docRef.id;
        }
    }
    async updateUsuario(id, usuario) {
        const docRef = (0, firestore_2.doc)(this.db, 'usuarios', id);
        await (0, firestore_2.updateDoc)(docRef, usuario);
    }
    async updateUsuarioPassword(id, hashedPassword) {
        const docRef = (0, firestore_2.doc)(this.db, 'usuarios', id);
        await (0, firestore_2.updateDoc)(docRef, { senha: hashedPassword });
    }
    async deleteUsuario(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'usuarios', id);
        await (0, firestore_2.deleteDoc)(docRef);
    }
    // ===== SERVIÇOS DE EQUIPES =====
    async getAllEquipes() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'equipes'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
        }));
    }
    async getEquipeById(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'equipes', id);
        const docSnap = await (0, firestore_2.getDoc)(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                dataCriacao: this.convertTimestamp(docSnap.data().dataCriacao)
            };
        }
        return null;
    }
    async createEquipe(equipe) {
        const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'equipes'), {
            ...equipe,
            dataCriacao: firestore_2.Timestamp.now()
        });
        return docRef.id;
    }
    async updateEquipe(id, equipe) {
        const docRef = (0, firestore_2.doc)(this.db, 'equipes', id);
        await (0, firestore_2.updateDoc)(docRef, equipe);
    }
    async deleteEquipe(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'equipes', id);
        await (0, firestore_2.deleteDoc)(docRef);
    }
    // ===== SERVIÇOS DE ATLETAS =====
    async getAllAtletas() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'atletas'));
        const atletas = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
            return {
                id: doc.id,
                ...data,
                dataNascimento: this.convertTimestamp(data.dataNascimento),
                dataFiliacao: this.convertTimestamp(data.dataFiliacao),
                dataCriacao: this.convertTimestamp(data.dataCriacao),
                equipe
            };
        }));
        return atletas;
    }
    async getAtletaById(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'atletas', id);
        const docSnap = await (0, firestore_2.getDoc)(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
            return {
                id: docSnap.id,
                ...data,
                dataNascimento: this.convertTimestamp(data.dataNascimento),
                dataFiliacao: this.convertTimestamp(data.dataFiliacao),
                dataCriacao: this.convertTimestamp(data.dataCriacao),
                equipe
            };
        }
        return null;
    }
    async getAtletaByCpf(cpf) {
        const q = (0, firestore_2.query)((0, firestore_2.collection)(this.db, 'atletas'), (0, firestore_2.where)('cpf', '==', cpf));
        const querySnapshot = await (0, firestore_2.getDocs)(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
            return {
                id: doc.id,
                ...data,
                dataNascimento: this.convertTimestamp(data.dataNascimento),
                dataFiliacao: this.convertTimestamp(data.dataFiliacao),
                dataCriacao: this.convertTimestamp(data.dataCriacao),
                equipe
            };
        }
        return null;
    }
    async createAtleta(atleta) {
        const cpfLimpo = atleta.cpf.replace(/\D/g, '');
        const atletaExistente = await this.getAtletaByCpf(cpfLimpo);
        if (atletaExistente) {
            throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema.`);
        }
        const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'atletas'), {
            ...atleta,
            cpf: cpfLimpo,
            status: 'ATIVO',
            dataNascimento: this.convertToTimestamp(atleta.dataNascimento),
            dataFiliacao: this.convertToTimestamp(atleta.dataFiliacao),
            dataCriacao: firestore_2.Timestamp.now()
        });
        return docRef.id;
    }
    async updateAtleta(id, atleta) {
        if (atleta.cpf) {
            const cpfLimpo = atleta.cpf.replace(/\D/g, '');
            const atletaExistente = await this.getAtletaByCpf(cpfLimpo);
            if (atletaExistente && atletaExistente.id !== id) {
                throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema.`);
            }
        }
        const docRef = (0, firestore_2.doc)(this.db, 'atletas', id);
        const updateData = {
            ...atleta,
            cpf: atleta.cpf ? atleta.cpf.replace(/\D/g, '') : undefined,
            dataNascimento: this.convertToTimestamp(atleta.dataNascimento),
            dataFiliacao: this.convertToTimestamp(atleta.dataFiliacao),
        };
        await (0, firestore_2.updateDoc)(docRef, updateData);
    }
    async deleteAtleta(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'atletas', id);
        await (0, firestore_2.deleteDoc)(docRef);
    }
    // ===== SERVIÇOS DE COMPETIÇÕES =====
    async getAllCompeticoes() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'competicoes'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dataCompeticao: this.convertTimestamp(doc.data().dataCompeticao),
            dataInicioInscricao: this.convertTimestamp(doc.data().dataInicioInscricao),
            dataFimInscricao: this.convertTimestamp(doc.data().dataFimInscricao),
            dataNominacaoPreliminar: this.convertTimestamp(doc.data().dataNominacaoPreliminar),
            dataNominacaoFinal: this.convertTimestamp(doc.data().dataNominacaoFinal),
            dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
        }));
    }
    async getCompeticaoById(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'competicoes', id);
        const docSnap = await (0, firestore_2.getDoc)(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                dataCompeticao: this.convertTimestamp(data.dataCompeticao),
                dataInicioInscricao: this.convertTimestamp(data.dataInicioInscricao),
                dataFimInscricao: this.convertTimestamp(data.dataFimInscricao),
                dataNominacaoPreliminar: this.convertTimestamp(data.dataNominacaoPreliminar),
                dataNominacaoFinal: this.convertTimestamp(data.dataNominacaoFinal),
                dataCriacao: this.convertTimestamp(data.dataCriacao)
            };
        }
        return null;
    }
    async createCompeticao(competicao) {
        const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'competicoes'), {
            ...competicao,
            dataCompeticao: this.convertToTimestamp(competicao.dataCompeticao),
            dataInicioInscricao: this.convertToTimestamp(competicao.dataInicioInscricao),
            dataFimInscricao: this.convertToTimestamp(competicao.dataFimInscricao),
            dataNominacaoPreliminar: this.convertToTimestamp(competicao.dataNominacaoPreliminar),
            dataNominacaoFinal: this.convertToTimestamp(competicao.dataNominacaoFinal),
            dataCriacao: firestore_2.Timestamp.now()
        });
        return docRef.id;
    }
    async updateCompeticao(id, competicao) {
        const docRef = (0, firestore_2.doc)(this.db, 'competicoes', id);
        const updateData = {
            ...competicao,
            dataCompeticao: this.convertToTimestamp(competicao.dataCompeticao),
            dataInicioInscricao: this.convertToTimestamp(competicao.dataInicioInscricao),
            dataFimInscricao: this.convertToTimestamp(competicao.dataFimInscricao),
            dataNominacaoPreliminar: this.convertToTimestamp(competicao.dataNominacaoPreliminar),
            dataNominacaoFinal: this.convertToTimestamp(competicao.dataNominacaoFinal)
        };
        await (0, firestore_2.updateDoc)(docRef, updateData);
    }
    async deleteCompeticao(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'competicoes', id);
        await (0, firestore_2.deleteDoc)(docRef);
    }
    // ===== SERVIÇOS DE INSCRIÇÕES =====
    async getAllInscricoes() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'inscricoes_competicao'));
        const inscricoes = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const atleta = await this.getAtletaById(data.idAtleta);
            const competicao = await this.getCompeticaoById(data.idCompeticao);
            return {
                id: doc.id,
                ...data,
                dataInscricao: this.convertTimestamp(data.dataInscricao),
                dataAprovacao: this.convertTimestamp(data.dataAprovacao),
                dataRejeicao: this.convertTimestamp(data.dataRejeicao),
                atleta,
                competicao
            };
        }));
        return inscricoes;
    }
    async getInscricoesByCompeticao(competicaoId) {
        const q = (0, firestore_2.query)((0, firestore_2.collection)(this.db, 'inscricoes_competicao'), (0, firestore_2.where)('idCompeticao', '==', competicaoId));
        const querySnapshot = await (0, firestore_2.getDocs)(q);
        const inscricoes = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const atleta = await this.getAtletaById(data.idAtleta);
            const competicao = await this.getCompeticaoById(data.idCompeticao);
            return {
                id: doc.id,
                ...data,
                dataInscricao: this.convertTimestamp(data.dataInscricao),
                dataAprovacao: this.convertTimestamp(data.dataAprovacao),
                dataRejeicao: this.convertTimestamp(data.dataRejeicao),
                atleta,
                competicao
            };
        }));
        return inscricoes;
    }
    async createInscricao(inscricao) {
        const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'inscricoes_competicao'), {
            ...inscricao,
            dataInscricao: firestore_2.Timestamp.now()
        });
        return docRef.id;
    }
    async updateInscricao(id, inscricao) {
        const docRef = (0, firestore_2.doc)(this.db, 'inscricoes_competicao', id);
        await (0, firestore_2.updateDoc)(docRef, inscricao);
    }
    async deleteInscricao(id) {
        const docRef = (0, firestore_2.doc)(this.db, 'inscricoes_competicao', id);
        await (0, firestore_2.deleteDoc)(docRef);
    }
    // ===== SERVIÇOS DE LOG =====
    async getAllLogs() {
        const q = (0, firestore_2.query)((0, firestore_2.collection)(this.db, 'log_atividades'), (0, firestore_2.orderBy)('dataHora', 'desc'));
        const querySnapshot = await (0, firestore_2.getDocs)(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dataHora: this.convertTimestamp(doc.data().dataHora)
        }));
    }
    async createLog(log) {
        const docRef = await (0, firestore_2.addDoc)((0, firestore_2.collection)(this.db, 'log_atividades'), {
            ...log,
            dataHora: firestore_2.Timestamp.now()
        });
        return docRef.id;
    }
    async clearLogs() {
        const querySnapshot = await (0, firestore_2.getDocs)((0, firestore_2.collection)(this.db, 'log_atividades'));
        const batch = (0, firestore_2.writeBatch)(this.db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    // ===== SERVIÇOS DE UPLOAD =====
    async uploadFile(file, path) {
        try {
            console.log('📁 FirebaseService: Iniciando upload para path:', path);
            const storageRef = (0, storage_2.ref)(this.storage, path);
            await (0, storage_2.uploadBytes)(storageRef, file);
            const url = await (0, storage_2.getDownloadURL)(storageRef);
            console.log('✅ FirebaseService: Upload concluído:', url);
            return url;
        }
        catch (error) {
            console.error('❌ FirebaseService: Erro no upload:', error);
            throw error;
        }
    }
    async deleteFile(path) {
        const storageRef = (0, storage_2.ref)(this.storage, path);
        await (0, storage_2.deleteObject)(storageRef);
    }
}
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebaseService.js.map