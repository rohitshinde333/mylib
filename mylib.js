const MyLib = {};

MyLib.config = {
    apiUrl: 'http://192.168.96.213:3000/oauth/token',
    clientId: 'YXBwbGljYXRpb246c2VjcmV0',
};

MyLib.verifyFace = async function(username, faceData) {
    try {
        var details = {
            'username': username,
            'password': faceData,
            'grant_type': 'password'
        };

        var formBody = [];
        for (var property in details) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }

        formBody = formBody.join("&");

        const response = await fetch(`${MyLib.config.apiUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${MyLib.config.clientId}`,
            },
            body: formBody
        });
        return await response.json();
    } catch (error) {
        console.error('Error verifying face:', error);
        throw error;
    }
};

MyLib.startFaceVerification = function (username) {
    const verificationWindow = window.open('', 'Verification Window', 'width=400,height=400');

    const openWebcamAndCapture = () => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const imagePreview = verificationWindow.document.createElement('img'); 
        const proceedButton = verificationWindow.document.createElement('button');
        const takePhotoButton = verificationWindow.document.createElement('button');
        const retakeButton = verificationWindow.document.createElement('button');
        const verifyButton = verificationWindow.document.createElement('button');
        let isTakingPhoto = false;
        let capturedPhotoData = null; 
        let stream = null;
        proceedButton.textContent = 'Proceed to Take Photo';
        takePhotoButton.textContent = 'Take Photo';
        retakeButton.textContent = 'Retake Photo';
        verifyButton.textContent = 'Verify';

        
        verificationWindow.document.body.style.margin = '0';
        verificationWindow.document.body.style.display = 'flex';
        verificationWindow.document.body.style.flexDirection = 'column';
        verificationWindow.document.body.style.alignItems = 'center';

        
        proceedButton.className = 'red-button';
        takePhotoButton.className = 'red-button';
        retakeButton.className = 'red-button';
        verifyButton.className = 'red-button';

       
        verificationWindow.document.body.appendChild(proceedButton);

        proceedButton.addEventListener('click', () => {
            verificationWindow.document.body.removeChild(proceedButton);
            startWebcamAccess();
        });

        function startWebcamAccess() {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(mediastream => {
                    stream = mediastream
                    video.srcObject = stream;
                    video.onloadedmetadata = () => {
                        video.play(); 
                    };
                    video.style.display = 'block';
                    verificationWindow.document.body.appendChild(video);
                    verificationWindow.document.body.appendChild(takePhotoButton);
                })
                .catch(error => {
                    console.error('Error accessing webcam:', error);
                    verificationWindow.close();
                });
        }

        takePhotoButton.addEventListener('click', () => {
            if (!isTakingPhoto) {
                isTakingPhoto = true;
                capturedPhotoData = null;
                video.style.display = 'none'; 
                verificationWindow.document.body.removeChild(takePhotoButton);
                verificationWindow.document.body.appendChild(retakeButton);
                verificationWindow.document.body.appendChild(verifyButton);

                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                capturedPhotoData = canvas.toDataURL('image/jpeg');

                
                imagePreview.src = capturedPhotoData;
                imagePreview.style.maxWidth = '100%';
                imagePreview.style.height = 'auto';
                verificationWindow.document.body.appendChild(imagePreview);
            }
        });

        retakeButton.addEventListener('click', () => {
            if (isTakingPhoto) {
                isTakingPhoto = false;
                capturedPhotoData = null;
                video.style.display = 'block';
                verificationWindow.document.body.removeChild(retakeButton);
                verificationWindow.document.body.removeChild(verifyButton);
                verificationWindow.document.body.removeChild(imagePreview); 
                verificationWindow.document.body.appendChild(video);
                verificationWindow.document.body.appendChild(takePhotoButton);
                
            }
        });

        verifyButton.addEventListener('click', () => {
            if (isTakingPhoto && capturedPhotoData) {
                isTakingPhoto = false;
                verificationWindow.document.body.removeChild(retakeButton);
                verificationWindow.document.body.removeChild(verifyButton);
                verificationWindow.document.body.removeChild(imagePreview); 
                stream.getTracks().forEach(track => track.stop());
                MyLib.verifyFace(username, capturedPhotoData)
                    .then(response => {
                        const responseDiv = verificationWindow.document.createElement('div');
                        responseDiv.textContent = JSON.stringify(response, null, 2);
                        verificationWindow.document.body.appendChild(responseDiv);
                        
                    })
                    .catch(error => {
                        console.error('Error verifying face:', error);
                        stream.getTracks().forEach(track => track.stop());
                        verificationWindow.close();
                    });
            }
        });
    };

    openWebcamAndCapture();
};

export { MyLib };
