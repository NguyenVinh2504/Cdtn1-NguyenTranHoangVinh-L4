-- CreateTable
CREATE TABLE "customer" (
    "customer_id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(120),
    "address" VARCHAR(255),
    "segment" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "device" (
    "device_id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "serial_no" VARCHAR(50) NOT NULL,
    "product_name" VARCHAR(100),
    "purchase_date" DATE,
    "warranty_months" SMALLINT NOT NULL DEFAULT 12,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "service_center" (
    "center_id" BIGSERIAL NOT NULL,
    "center_name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "city" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_center_pkey" PRIMARY KEY ("center_id")
);

-- CreateTable
CREATE TABLE "issue_category" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(60) NOT NULL,
    "default_priority" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "issue_category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "technician" (
    "technician_id" BIGSERIAL NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "center_id" BIGINT NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "proficiency" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_pkey" PRIMARY KEY ("technician_id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "ticket_id" BIGSERIAL NOT NULL,
    "ticket_code" VARCHAR(20) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "device_id" BIGINT NOT NULL,
    "center_id" BIGINT NOT NULL,
    "technician_id" BIGINT,
    "category_id" INTEGER,
    "issue_desc" TEXT NOT NULL,
    "priority" VARCHAR(12) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'MOI',
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMPTZ NOT NULL,
    "closed_at" TIMESTAMPTZ,
    "status_history" JSONB NOT NULL DEFAULT '[]',
    "appointment_at" TIMESTAMPTZ,
    "appointment_status" VARCHAR(20),

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_phone_key" ON "customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "device_serial_no_key" ON "device"("serial_no");

-- CreateIndex
CREATE UNIQUE INDEX "issue_category_category_name_key" ON "issue_category"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "technician_employee_id_key" ON "technician"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ticket_code_key" ON "ticket"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_ticket_status_center_received" ON "ticket"("status", "center_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ticket_tech_due_date" ON "ticket"("technician_id", "due_date" ASC);

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician" ADD CONSTRAINT "technician_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "service_center"("center_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "service_center"("center_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician"("technician_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "issue_category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
