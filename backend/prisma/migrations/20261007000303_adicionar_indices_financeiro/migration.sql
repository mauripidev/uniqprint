-- CreateIndex
CREATE INDEX `lancamentos_financeiros_data_lancamento_idx` ON `lancamentos_financeiros`(`data_lancamento`);

-- CreateIndex
CREATE INDEX `lancamentos_financeiros_tipo_idx` ON `lancamentos_financeiros`(`tipo`);

-- CreateIndex
CREATE INDEX `lancamentos_financeiros_categoria_idx` ON `lancamentos_financeiros`(`categoria`);

-- CreateIndex
CREATE INDEX `lancamentos_financeiros_tipo_referencia_referencia_id_idx` ON `lancamentos_financeiros`(`tipo_referencia`, `referencia_id`);

-- CreateIndex
CREATE INDEX `movimentacoes_estoque_produto_id_tipo_idx` ON `movimentacoes_estoque`(`produto_id`, `tipo`);

-- CreateIndex
CREATE INDEX `movimentacoes_estoque_criado_em_idx` ON `movimentacoes_estoque`(`criado_em`);
