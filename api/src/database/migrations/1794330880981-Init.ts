import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794330880981 implements MigrationInterface {
    name = 'Init1794330880981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`)
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(80) NOT NULL, "email" character varying(160) NOT NULL, "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(60) NOT NULL, "kind" character varying(12) NOT NULL, "color" character varying(9) NOT NULL DEFAULT '#3d6b5c', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b5b3b2f82aa6da1a5104cf3835" ON "accounts" ("user_id", "name") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(40) NOT NULL, "kind" character varying(10) NOT NULL, "color" character varying(9) NOT NULL, "monthly_budget" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_48f0690983e955b500b4a3e029" ON "categories" ("user_id", "name") `);
        await queryRunner.query(`CREATE TABLE "import_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "account_id" uuid NOT NULL, "filename" character varying(200) NOT NULL, "format" character varying(30) NOT NULL, "status" character varying(12) NOT NULL DEFAULT 'processing', "error" character varying(300), "total_count" integer NOT NULL DEFAULT '0', "imported_count" integer NOT NULL DEFAULT '0', "duplicate_count" integer NOT NULL DEFAULT '0', "categorized_count" integer NOT NULL DEFAULT '0', "period_start" date, "period_end" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6162597a2576c03e04bb2c1a2dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "pattern" character varying(120) NOT NULL, "match_type" character varying(12) NOT NULL DEFAULT 'contains', "category_id" uuid NOT NULL, "priority" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_10fef696a7d61140361b1b23608" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "account_id" uuid NOT NULL, "category_id" uuid, "import_batch_id" uuid, "date" date NOT NULL, "description" character varying(300) NOT NULL, "amount" integer NOT NULL, "external_id" character varying(120), "notes" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f029fb796d7bbae7734afed62f" ON "transactions" ("account_id", "external_id") WHERE "external_id" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_fe815e76e6d1e733cebfd0f903" ON "transactions" ("user_id", "date") `);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_2296b7fe012d95646fa41921c8b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "import_batches" ADD CONSTRAINT "FK_b75a8496dcd95067be919bba660" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "import_batches" ADD CONSTRAINT "FK_7ef70ec6616d8cb7a4ad99ddae1" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rules" ADD CONSTRAINT "FK_a25301750f8ef387215a9c6043b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rules" ADD CONSTRAINT "FK_82d72999266cf5aed89fc4614f3" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_5978bd3c7a98004633cbc472022" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_5978bd3c7a98004633cbc472022"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "rules" DROP CONSTRAINT "FK_82d72999266cf5aed89fc4614f3"`);
        await queryRunner.query(`ALTER TABLE "rules" DROP CONSTRAINT "FK_a25301750f8ef387215a9c6043b"`);
        await queryRunner.query(`ALTER TABLE "import_batches" DROP CONSTRAINT "FK_7ef70ec6616d8cb7a4ad99ddae1"`);
        await queryRunner.query(`ALTER TABLE "import_batches" DROP CONSTRAINT "FK_b75a8496dcd95067be919bba660"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_2296b7fe012d95646fa41921c8b"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe815e76e6d1e733cebfd0f903"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f029fb796d7bbae7734afed62f"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "rules"`);
        await queryRunner.query(`DROP TABLE "import_batches"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48f0690983e955b500b4a3e029"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5b3b2f82aa6da1a5104cf3835"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
