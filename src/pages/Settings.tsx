import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">프로필, 알림, 데이터 관리</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground text-sm">
          설정 화면 준비 중
        </CardContent>
      </Card>
    </div>
  );
}
