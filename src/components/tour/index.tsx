'use client'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLocalStorage } from 'usehooks-ts'

export default function FirstTimeTour() {
  const { path } = useParams()

  const [hasCompletedTour, setTourState] = useLocalStorage(
    'has-completed-tour',
    0,
  )

  useEffect(() => {
    if (!path || hasCompletedTour) return
    const driverObj = driver({
      onDestroyed: () => {
        setTourState(1)
      },
      showProgress: true,
      steps: [
        {
          popover: {
            title: 'Welcome to the ADR-Manager',
            description:
              'Here is a quick guide to help you with our new features!',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '.fileTreeSidebar',
          popover: {
            title: 'File tree and repository selector',
            description:
              'On the left hand side sidebar, you can select one of your repositories, and view all of your files and search for them!',
          },
        },
        {
          element: '.textEditor',
          popover: {
            title: 'Selecting and editing  a file',
            description:
              'After you have selected or created a new markdown file, you can edit them using the rich-text editor.',
          },
        },
        {
          element: '.templateSidebar',
          popover: {
            title: 'Template selector and editor',
            description:
              'On the right you can select one of our four ADR templates, and edit the fields directly here.',
          },
        },
        {
          element: '.updateOrCreateFile',
          popover: {
            title: 'Pushing your changes',
            description:
              "Once you've finished editing the file, make sure to push these changes to the github repository using this button!",
          },
        },
        {
          element: '.synchronizeButton',
          popover: {
            title: 'Synchronizing your file',
            description:
              'If the file already exists in the repository, you can synchronize any changes by pulling from the repository with the "synchronize" button. Keep in mind that all local changes will be overwritten!',
          },
        },
      ],
    })

    driverObj.drive()

    return () => {
      driverObj.destroy()
    }
  }, [path, setTourState])
  return null
}
