FROM public.ecr.aws/lambda/nodejs:20 AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
RUN pnpm install --frozen-lockfile
COPY . .
FROM builder AS pruner
WORKDIR /app
RUN mkdir /prod_app
RUN pnpm deploy --filter ./apps/server --prod /prod_app
FROM public.ecr.aws/lambda/nodejs:20
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=pruner /prod_app ./
CMD ["lambda.handler"]