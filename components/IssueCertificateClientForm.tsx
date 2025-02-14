/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "@/hooks/use-toast";
import { CopyableCode } from "./CopyableCode";

export default function Form() {
  const [domain, setDomain] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [keyAuthorization, setKeyAuthorization] = useState({
    key: "",
    token: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  const getKeyAuthorization = async () => {
    try {
      const response = await axios.get(
        `/api/certificates/keyAuthorization?domain=${domain}`
      );
      setKeyAuthorization({
        key: response.data.keyAuthorization,
        token: response.data.token,
      });
    } catch (error: any) {
      console.error("Could not get key authorization:", error);
      toast({
        title: "Error",
        description: "Failed to fetch key authorization.",
        variant: "destructive",
      });
    }
  };

  const issueCert = async () => {
    if (!domain || !email) {
      setResult("Domain and email are required");
      return;
    }

    setIsLoading(true);
    setResult("");
    setKeyAuthorization({ key: "", token: "" });
    setIsVerified(false);

    try {
      const response = await axios.post("/api/certificates/order", {
        domain,
        email,
      });
      setResult(response.data.message);
      getKeyAuthorization(); // Fetch key authorization after issuing the certificate
    } catch (error: any) {
      console.dir(error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to issue certificate.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeOrder = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description: "Domain is required.",
        variant: "destructive",
      });
      return;
    }

    setIsFinalizing(true);

    try {
      const response = await axios.put(
        `/api/certificates/finalize?domain=${domain}`
      );
      setResult(response.data.message);
      setIsVerified(true);
      toast({
        title: "Success",
        description: "Certificate issued successfully!",
      });
    } catch (error: any) {
      console.error("Failed to finalize order:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to finalize order.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <Card className="container mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="domain" className="block text-sm font-medium mb-2">
          Domain:
        </label>
        <input
          id="domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="example.com"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email:
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="admin@example.com"
        />
      </div>
      <div className="space-x-2">
        <Button
          onClick={issueCert}
          disabled={isLoading || email === "" || domain === ""}
          className="px-4 py-2 text-white rounded-md"
        >
          {isLoading ? "Issuing Certificate..." : "Issue Certificate"}
        </Button>
        <Button
          onClick={getKeyAuthorization}
          disabled={!domain}
          variant="outline"
          className="px-4 py-2 rounded-md"
        >
          Check Key Authorization
        </Button> <Button
          onClick={finalizeOrder}
          disabled={!keyAuthorization.key || isFinalizing}
          className="px-4 py-2 text-white bg-green-600 rounded-md"
        >
          {isFinalizing ? "Finalizing..." : "Finalize Order"}
        </Button>
      </div>
      {result && (
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">
          {result}
        </p>
      )}
      <CopyableCode
        code={keyAuthorization.key}
        title="Key Authorization: "
        details={
          keyAuthorization.token &&
          `Copy the Key Authorization below and create a file at: \n
          http://${domain}/.well-known/acme-challenge/${keyAuthorization.token}\n
          Paste the Key Authorization as the content of that file, then the system will detect verification automatically.`
        }
      />
      {isVerified && (
        <p className="mt-4 text-sm text-green-700">
          ✅ Your certificate has been successfully issued!
        </p>
      )}
    </Card>
  );
}
