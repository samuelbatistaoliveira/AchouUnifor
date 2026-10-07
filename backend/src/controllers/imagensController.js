const supabase = require('../config/supabase');
const pool = require('../config/database');
const { randomUUID } = require('crypto');

async function uploadImagem(req, res) {
    let caminho = null;

    try {
        const { id_item } = req.params;

        // Verifica se uma imagem foi enviada
        if (!req.file) {
            return res.status(400).json({
                mensagem: 'Nenhuma imagem enviada.'
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

        // Gera um nome único para a imagem
        const extensoes = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };

        const extensao = extensoes[req.file.mimetype];

        if (!extensao) {
            return res.status(400).json({
                mensagem: 'Formato de imagem não permitido.'
            });
        }

        caminho = `${id_item}/${randomUUID()}.${extensao}`;

        // Envia a imagem para o Supabase Storage
        const { error } = await supabase.storage
            .from('itens')
            .upload(caminho, req.file.buffer, {
                contentType: req.file.mimetype
            });

        if (error) {
            throw error;
        }

        // Salva o caminho da imagem no PostgreSQL
        const imagem = await pool.query(
            `INSERT INTO imagens_itens (id_item, caminho)
             VALUES ($1, $2)
             RETURNING *`,
            [id_item, caminho]
        );

        return res.status(201).json({
            mensagem: 'Imagem enviada com sucesso.',
            imagem: imagem.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao enviar imagem:', erro);

        // Remove o arquivo se o registro no banco falhar
        if (caminho) {
            await supabase.storage
                .from('itens')
                .remove([caminho])
                .catch(console.error);
        }

        return res.status(500).json({
            mensagem: 'Erro ao enviar imagem.'
        });
    }
}

module.exports = { uploadImagem };