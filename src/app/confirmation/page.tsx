import Feedback from "@/components/Feedback";

export default function ConfirmationPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Confirmação</h2>
      <Feedback success={true} tokenAddress="Exemplo1234..." />
    </div>
  );
}
