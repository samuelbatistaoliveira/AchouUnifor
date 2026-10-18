const supabase = require('../config/supabase');
const pool = require('../config/database');
const { randomUUID } = require('crypto');

const EXTENSOES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

// Envia o arquivo ao Storage dentro de `pasta` e grava o caminho com `registrar(caminho)`.
// Se o registro no banco falhar, o arquivo é apagado do Storage.
async function salvarNoStorage(pasta, arquivo, registrar) {
    const caminho = `${pasta}/${randomUUID()}.${EXTENSOES[arquivo.mimetype]}`;

    const { error } = await supabase.storage
        .from('itens')
        .upload(caminho, arquivo.buffer, {
            contentType: arquivo.mimetype
        });

    if (error) {
        throw error;
    }

    try {
        return await registrar(caminho);
    } catch (erro) {
        await supabase.storage
            .from('itens')
            .remove([caminho])
            .catch(console.error);
        throw erro;
    }
}

async function uploadImagem(req, res) {
    try {
        const { id_item } = req.params;

        // Verifica se uma imagem foi enviada
        if (!req.file) {
            return res.status(400).json({
                mensagem: 'Nenhuma imagem enviada.'
            });
        }

        if (!EXTENSOES[req.file.mimetype]) {
            return res.status(400).json({
                mensagem: 'Formato de imagem não permitido.'
            });
        }

        // Confere se o item existe no banco
        const resultado = await pool.query(
            'SELECT id_item FROM itens WHERE id_item = $1',
            [id_item]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: 'Item não encontrado.'
            });
        }

        // Envia ao Storage e salva o caminho da imagem no PostgreSQL
        const imagem = await salvarNoStorage(id_item, req.file, (caminho) =>
            pool.query(
                `INSERT INTO imagens_itens (id_item, caminho)
                 VALUES ($1, $2)
                 RETURNING *`,
                [id_item, caminho]
            )
        );

        return res.status(201).json({
            mensagem: 'Imagem enviada com sucesso.',
            imagem: imagem.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao enviar imagem:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao enviar imagem.'
        });
    }
}

const MAX_FOTOS_DENUNCIA = 5;

// Foto de uma denúncia de perda: só o aluno que fez a denúncia envia, até 5 por denúncia
async function uploadImagemDenuncia(req, res) {
    try {
        const id_denuncia = Number(req.params.id_denuncia);

        if (!req.file) {
            return res.status(400).json({ mensagem: 'Nenhuma imagem enviada.' });
        }

        if (!EXTENSOES[req.file.mimetype]) {
            return res.status(400).json({ mensagem: 'Formato de imagem não permitido.' });
        }

        if (!Number.isInteger(id_denuncia)) {
            return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
        }

        const { rows: [denuncia] } = await pool.query(
            `SELECT denuncias.id_denuncia, count(imagens_denuncias.id_imagem)::int AS fotos
             FROM denuncias
             LEFT JOIN imagens_denuncias ON imagens_denuncias.id_denuncia = denuncias.id_denuncia
             WHERE denuncias.id_denuncia = $1 AND denuncias.id_usuario = $2
             GROUP BY denuncias.id_denuncia`,
            [id_denuncia, req.usuario.id_usuario]
        );

        if (!denuncia) {
            return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
        }

        // shortcut: a contagem não trava a linha, envios simultâneos podem passar de 5; usar lock se virar abuso
        if (denuncia.fotos >= MAX_FOTOS_DENUNCIA) {
            return res.status(400).json({ mensagem: `Cada denúncia pode ter no máximo ${MAX_FOTOS_DENUNCIA} fotos.` });
        }

        const imagem = await salvarNoStorage(`denuncias/${id_denuncia}`, req.file, (caminho) =>
            pool.query(
                'INSERT INTO imagens_denuncias (id_denuncia, caminho) VALUES ($1, $2) RETURNING id_imagem',
                [id_denuncia, caminho]
            )
        );

        return res.status(201).json({ id_imagem: imagem.rows[0].id_imagem });

    } catch (erro) {
        console.error('Erro ao enviar imagem da denúncia:', erro);
        return res.status(500).json({ mensagem: 'Erro ao enviar imagem.' });
    }
}

async function listarImagensItem(req, res) {
    try {
        const { id_item } = req.params;

        const resultado = await pool.query(
            `SELECT id_imagem, id_item, caminho
             FROM imagens_itens
             WHERE id_item = $1
             ORDER BY id_imagem`,
            [id_item]
        );

        const imagens = await Promise.all(
            resultado.rows.map(async (imagem) => {
                const { data, error } = await supabase.storage
                    .from('itens')
                    .createSignedUrl(imagem.caminho, 3600);

                if (error) {
                    throw error;
                }

                return {
                    id_imagem: imagem.id_imagem,
                    id_item: imagem.id_item,
                    url: data.signedUrl
                };
            })
        );

        return res.status(200).json({ imagens });

    } catch (erro) {
        console.error('Erro ao buscar imagens:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao buscar imagens do item.'
        });
    }
}

module.exports = {
    uploadImagem,
    uploadImagemDenuncia,
    listarImagensItem
};