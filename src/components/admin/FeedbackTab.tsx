'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Feedback } from './types'
import { formatDate } from './utils'

interface FeedbackTabProps {
  feedback: Feedback[]
  onDeleteFeedback: (feedbackId: string) => void
}

export function FeedbackTab({ feedback, onDeleteFeedback }: FeedbackTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilbakemeldinger</CardTitle>
        <CardDescription>Se hva brukerne savner og ønsker seg</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen tilbakemeldinger ennå</p>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 whitespace-pre-wrap">{item.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {item.user ? (
                      <>Fra {item.user.full_name || item.user.email}</>
                    ) : (
                      <>Anonym</>
                    )}
                    {' • '}
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="ml-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Slett
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slett tilbakemelding?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil slette denne tilbakemeldingen?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteFeedback(item.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
