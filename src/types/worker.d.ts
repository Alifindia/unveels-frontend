// worker.d.ts
declare module "*.ts" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
