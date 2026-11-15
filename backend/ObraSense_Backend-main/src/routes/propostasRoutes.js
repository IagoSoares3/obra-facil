// Rotas para enviar propostas a solicitações e aceitar uma proposta como cliente.
import { Router } from 'express';
import { lerBanco, novoRegistro, transacionar } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Cria o roteador das propostas.
const router = Router();

// Cria uma proposta para uma solicitação ainda aberta.
router.post('/', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
 
  try {
    
    // Lê os dados recebidos e converte os valores numéricos para validação.
    const { solicitacaoId, valor, descricao } = req.body ?? {};
    
    const id = Number(solicitacaoId), preco = Number(valor);
    
    if (!Number.isInteger(id) || id < 1 || !Number.isFinite(preco) || preco <= 0 || typeof descricao !== 'string' || !descricao.trim()) return res.status(400).json({ erro: 'Informe solicitação, valor e descrição válidos.' });
    
    const banco = lerBanco();
    const prestador = banco.prestadores.find(({ usuarioId }) => usuarioId === req.usuario.id);
    const solicitacao = banco.solicitacoes.find((item) => item.id === id);
    
    // Confirma que o usuário possui perfil de prestador e que a solicitação aceita propostas.
    if (!prestador) return res.status(403).json({ erro: 'Perfil de prestador não encontrado.' });
    
    if (!solicitacao || solicitacao.status !== 'ABERTA') return res.status(409).json({ erro: 'Solicitação indisponível.' });
   
    const proposta = await transacionar((estado) => {
      if (estado.propostas.some((item) => item.solicitacaoId === id && item.prestadorId === prestador.id)) {
        const erroDuplicado = new Error('Proposta já enviada.');
        erroDuplicado.code = 'P2002';
        throw erroDuplicado;
      }
      if (!estado.solicitacoes.some((item) => item.id === id && item.status === 'ABERTA')) {
        return null;
      }
      return novoRegistro(estado, 'propostas', {
        solicitacaoId: id,
        prestadorId: prestador.id,
        valor: preco,
        descricao: descricao.trim(),
      });
    });
    if (!proposta) return res.status(409).json({ erro: 'Solicitação indisponível.' });
   
    res.status(201).json(proposta);
  
  } catch (erro) {
    
    // Converte a violação de unicidade (proposta repetida) em resposta HTTP 409.
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Você já enviou uma proposta para esta solicitação.' });
    
    next(erro);
  
  }

});

// Permite que o cliente dono da solicitação aceite uma proposta.
router.post('/:id/aceitar', requireAuth, requireRole('CLIENTE'), async (req, res, next) => {
  
  try {
    
    const id = Number(req.params.id);
    
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido.' });
    
    // Executa as alterações relacionadas juntas para evitar contratação parcial.
    const resultado = await transacionar((banco) => {
      const proposta = banco.propostas.find((item) => item.id === id);
      const solicitacao = proposta && banco.solicitacoes.find((item) => item.id === proposta.solicitacaoId);
      
      // Impede aceitar proposta de solicitação pertencente a outro cliente.
      if (!proposta || !solicitacao || solicitacao.clienteId !== req.usuario.id) return { erro: 'Proposta não encontrada.', status: 404 };
      
      if (solicitacao.status !== 'ABERTA') return { erro: 'Solicitação já encerrada.', status: 409 };
     
      solicitacao.status = 'CONTRATADA';
      proposta.status = 'ACEITA';
      
      // Recusa as demais propostas e gera a obra correspondente à contratação.
      banco.propostas
        .filter((item) => item.solicitacaoId === proposta.solicitacaoId && item.id !== id)
        .forEach((item) => { item.status = 'RECUSADA'; });
      const obra = novoRegistro(banco, 'obras', {
        nome: solicitacao.titulo,
        orcamento: proposta.valor,
        clienteId: req.usuario.id,
        prestadorId: proposta.prestadorId,
        solicitacaoId: proposta.solicitacaoId,
      });
      return { obra };
    });
    if (resultado.erro) return res.status(resultado.status).json({ erro: resultado.erro });
    res.json(resultado);
  } catch (erro) { next(erro); }
});

// Disponibiliza o roteador para montagem no servidor.
export default router;
