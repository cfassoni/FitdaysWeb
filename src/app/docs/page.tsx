import { notFound } from "next/navigation";
import { isSwaggerEnabled } from "@/lib/openapi";
import SwaggerDocsClient from "./SwaggerDocsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "API Documentation | FitdaysWeb / Recomp Pro",
  description: "Interactive Swagger API documentation for development and testing",
};

export default function DocsPage() {
  if (!isSwaggerEnabled()) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <SwaggerDocsClient />
    </div>
  );
}
