-- CreateTable
CREATE TABLE `registros_auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `acao` VARCHAR(191) NOT NULL,
    `entidade` VARCHAR(191) NOT NULL,
    `entidade_id` INTEGER NULL,
    `dados` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registros_auditoria_usuario_id_idx`(`usuario_id`),
    INDEX `registros_auditoria_acao_idx`(`acao`),
    INDEX `registros_auditoria_entidade_idx`(`entidade`),
    INDEX `registros_auditoria_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registros_auditoria` ADD CONSTRAINT `registros_auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
