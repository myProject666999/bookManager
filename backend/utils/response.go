package utils

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(data interface{}) Response {
	return Response{
		Code:    200,
		Message: "success",
		Data:    data,
	}
}

func SuccessWithMessage(message string, data interface{}) Response {
	return Response{
		Code:    200,
		Message: message,
		Data:    data,
	}
}

func Error(code int, message string) Response {
	return Response{
		Code:    code,
		Message: message,
	}
}

func ErrorWithData(code int, message string, data interface{}) Response {
	return Response{
		Code:    code,
		Message: message,
		Data:    data,
	}
}

type PageData struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

func Page(list interface{}, total int64, page, pageSize int) Response {
	return Success(PageData{
		List:     list,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}
