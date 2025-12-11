"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopRightPanel() {
    return (
        <Card className="w-72 h-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                    Active Users
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                        Placeholder
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
